"use strict";

import async from "async";
import lodash from "lodash";
import logger from "../../server/log";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import statusCodes from "../../server/utils/status-codes";
import constants from "../../server/utils/constants";

module.exports = function(EmailQueue) {

  EmailQueue.remoteMethod(
    "deletePeople", {
      description: "Deletes people assoiciate with campagin from EmailQueue",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}},
                {arg: "reqParams", type: "object", http: {source: "body"}}],
      returns: {arg: "person", type: "person", root: true},
      http: {verb: "post", path: "/people"}
    }
  );

  /**
   * Deletes the emailQueue entry for given ids and puts entry in
   * DeletedCampaginPerson model
   * Ex.input {"ids": [1,2,3,4]}
   *
   * @param  {[context]} ctx            [application context]
   * @param  {[JSON]} reqParams      [input shown in the comment]
   * @param  {[function]} deletePeopleCB [callback function]
   * @author Ramanavel Selvaraju
   */
  EmailQueue.deletePeople = (ctx, reqParams, deletePeopleCB) => {
    async.waterfall([
     async.apply(getEmailsFromQueue, reqParams.ids, ctx.req.accessToken.userId),
     EmailQueue.app.models.deletedCampaignPerson.saveDeletedPeople,
     updateMetricFailedCount,
     deleteEmailsFromQueue
    ], (asyncErr) => {
      if(asyncErr) {
        return deletePeopleCB(errorMessages.SERVER_ERROR);
      }
      return deletePeopleCB(null, "Deleted Successfully!");
    });
  };

  /**
   * gets the emails using id with userid from the emal Queue
   *
   * @param  {[Array]} ids   [Array of emailQueueIds]
   * @param  {[number]} userId  [currentUserId]
   * @param  {[function]} getEmailsFromQueueCB [callback]
   * @author Ramanavel Selvaraju
   */
  const getEmailsFromQueue = (ids, userId, getEmailsFromQueueCB) => {
    EmailQueue.find({where: {and: [{id: {inq: ids}}, {userId: userId}]}
    }, (emailFindErr, emails) => {
      if(emailFindErr){
        logger.error({error: emailFindErr, stack: emailFindErr.stack,
                      input: {ids: ids, userId: userId}});
        return getEmailsFromQueueCB(emailFindErr);
      }
      return getEmailsFromQueueCB(null, ids, userId, emails);
    });
  };

  /**
   * update related tables and status for deleting failed emails
   * @param  {[Array[Number]]}  ids  [emailQueueIds]
   * @param  {[number]}   userId   [current userId]
   * @param  {[EmailQueue]}   emails   [email objects from queue]
   * @param  {[type]} updateMetricCB [description]
   * @return {[type]}           [description]
   * @author Rahul Khandelwal
   */
  const updateMetricFailedCount = (ids, userId, emails, updateMetricCB) => {
    if(lodash.isEmpty(emails)) return updateMetricCB(null);
    async.eachSeries(emails, (deletedEmail, emailCB) => {
      async.waterfall([
        async.apply(updateRelatedMetrics, deletedEmail),
        updateCampaignStatus
      ], (err) => {
        return emailCB(err);
      });
    }, (asyncErr) => {
      return updateMetricCB(asyncErr, ids, userId, emails);
    });
  };

  /**
   * update related tables for deleting failed emails
   * @param  {[EmailQueue]}  deletedEmail  [description]
   * @param  {[type]} callback [description]
   * @return {[type]}           [description]
   * @author Rahul Khandelwal
   */
  const updateRelatedMetrics = (deletedEmail, updateRelatedMetricsCB) => {
    async.parallel({
      campaignMetric:
          updateCampaignMetric.bind(null, deletedEmail),
      listMetric:
          updateListMetric.bind(null, deletedEmail),
      followUpMetric:
          updateFollowUpMetric.bind(null, deletedEmail),
      followUps:
          EmailQueue.app.models.followUp
          .getFollowUpsCampaignId.bind(null, deletedEmail.campaignId)
    }, (err, results) => {
      updateRelatedMetricsCB(err, deletedEmail, results.campaignMetric,
        results.listMetric, results.followUpMetric, results.followUps);
     });
   };

  /**
   * update campaign metric on failed mail deletion
   * @param  {Object} emailQueue
   * @param  {Function} updateMetricCB
   * @author Rahul Khandelwal
   */
  const updateCampaignMetric = (emailQueue, updateMetricCB) => {
   if(emailQueue.followUpId) return updateMetricCB(null);
   let campaignMetricInst = {
     sentEmails : 1,
     campaignId : emailQueue.campaignId
   };
   EmailQueue.app.models.campaignMetric.find({
     where: {
       campaignId: emailQueue.campaignId
     }
   }, (campaignMetricErr, campaignMetric) => {
     if (campaignMetricErr) {
       logger.error("Error while finding campaign Metric",
       {error: campaignMetricErr, stack:campaignMetricErr.stack,
         input: {campaignId: emailQueue.campaignId}});
       return updateMetricCB(campaignMetricErr);
     }
     if (!lodash.isEmpty(campaignMetric)) {
       campaignMetricInst = campaignMetric[0];
       if(emailQueue.isStopped === constants.SYSTEM)
         campaignMetricInst.failedEmails = --campaignMetric[0].failedEmails;
       campaignMetricInst.assembled = --campaignMetric[0].assembled;
     }
     EmailQueue.app.models.campaignMetric.upsert(campaignMetricInst,
       (campaignMetricInstErr, response) => {
         if(campaignMetricInstErr){
          logger.error("Error while updating campaign metric",
              {error: campaignMetricInstErr, stack: campaignMetricInstErr.stack,
                    input: {campaignMetricInst: campaignMetricInst}});
              return updateMetricCB(errorMessages.SERVER_ERROR);
         }
         return updateMetricCB(null, response);
     });
   });
  };


  /**
   * update followup metric on failed mail deletion
   * @param  {Object} emailQueue
   * @param  {Function} updateMetricCB
   * @author Rahul Khandelwal
   */
   const updateFollowUpMetric = (emailQueue, updateMetricCB) => {
     if(!emailQueue.followUpId) return updateMetricCB(null);
     let followUpMetricInst = {
       sentEmails : 1,
       followUpId : emailQueue.followUpId,
       campaignId : emailQueue.campaignId
     };
     EmailQueue.app.models.followUpMetric.find({
       where: {
         followUpId: emailQueue.followUpId
       }
     }, (followUpMetricErr, followUpMetric) => {
       if (followUpMetricErr) {
         logger.error("Error while finding followUp Metric",
         {error: followUpMetricErr, stack:followUpMetricErr.stack,
           input: {followUpId: emailQueue.followUpId}});
         return updateMetricCB(followUpMetricErr);
       }
       if (!lodash.isEmpty(followUpMetric)) {
         followUpMetricInst = followUpMetric[0];
        if(emailQueue.isStopped === constants.SYSTEM)
         followUpMetricInst.failedEmails = --followUpMetric[0].failedEmails;
         followUpMetricInst.assembled = --followUpMetric[0].assembled;
       }
       EmailQueue.app.models.followUpMetric.upsert(followUpMetricInst,
        (followUpMetricInstErr, response) => {
          if(followUpMetricInstErr){
            logger.error("Error while updating followUp Metric",
            {error: followUpMetricInstErr, stack:followUpMetricInstErr.stack,
              input: {followUpMetricInst: followUpMetricInst}});
              return updateMetricCB(errorMessages.SERVER_ERROR);
          }
        return updateMetricCB(null, response);
       });
     });
   };

  /**
   * update list Metric on failed mail deletion
   * @param  {Object} emailQueue
   * @param  {Function} updateMetricCB
   * @author Rahul Khandelwal
   */
  const updateListMetric = (emailQueue, updateMetricCB) => {
     if(emailQueue.followUpId) return updateMetricCB(null);
     EmailQueue.app.models.campaign
     .getCampaignListForPerson(emailQueue.campaignId,
         emailQueue.personId, (err, lists) => {
       let updatedLists = [];
       async.each(lists, (list, listCB) => {
         EmailQueue.app.models.listMetric.findByListIdAndCampaignId(
             list.id, emailQueue.campaignId, (listMetricErr, listMetric) => {
           if(listMetricErr){
             return listCB(listMetricErr);
           }
           let listMetricInst = {
             sentEmails : 1,
             listId : list.id,
             campaignId : emailQueue.campaignId
           };
           if(listMetric) {
             listMetricInst = listMetric;
            if(emailQueue.isStopped === constants.SYSTEM)
             listMetricInst.failedEmails = --listMetric.failedEmails;
             listMetricInst.assembled = --listMetric.assembled;
           }
           updatedLists.push(listMetricInst);
           EmailQueue.app.models.listMetric
           .upsert(listMetricInst, (listMetricInstErr, response) => {
             if(listMetricInstErr){
               logger.error("Error while updating list metric",
               {error: listMetricInstErr, stack: listMetricInstErr.stack,
                 input: {listMetricInst: listMetricInst}});
                 return listCB(errorMessages.SERVER_ERROR);
             }
            return listCB(null);
           });
         });
       }, (listErr) => {
         return updateMetricCB(listErr, updatedLists);
       });
     });
   };

   /**
    * update status of the campaign after deleting failed mail
    * @param  {Object} emailQueue
    * @param  {Object} results
    * @param  {Function} updateMetricCB
    * @author Rahul Khandelwal
    */
   const updateCampaignStatus = (deletedEmail, campaignMetric, listMetric,
     followUpMetric, followUps, updateCampaignStatusCB) => {
     async.parallel({
       campaign: async.apply(updateCampaign,
           deletedEmail, campaignMetric, followUpMetric, followUps),
       followUp: async.apply(updateFollowUp,
           deletedEmail, campaignMetric, followUpMetric)
     }, (err) => {
       return updateCampaignStatusCB(err);
     });
   };

   /**
    * update campaign status based on metrics on deleting failed mail
     * @param  {Object} emailQueue
     * @param  {CampaignMetric} campaignMetric
     * @param  {FollowUpMetric} followUpMetric
     * @param  {Function} updateFollowUpCB
     * @author Rahul Khandelwal
    */
  const updateCampaign = (emailQueue, campaignMetric, followUpMetric, followUps,
     updateCampaignCB) => {
   EmailQueue.app.models.campaign.findById(emailQueue.campaignId,
     (err, campaign) => {
      let updateProperties = {};
       async.series([
         async.apply(statusByCampaign, updateProperties, campaign),
         async.apply(statusByCampaignMetric, updateProperties,
           campaignMetric, followUps),
         async.apply(statusByFollowUpMetric, updateProperties,
           followUpMetric, followUps)
       ], (asyncErr, results) => {
         if (asyncErr) {
            return updateCampaignCB(asyncErr, updatedCampaign);
         }
         campaign.updateAttributes(updateProperties,
           (updatePropertiesErr, updatedCampaign) => {
           if (updatePropertiesErr) {
             logger.error("Error while update campaign status",
             {error: updatePropertiesErr, stack: updatePropertiesErr.stack,
               input: {updateProperties: updateProperties}});
               return updateCampaignCB(errorMessages.SERVER_ERROR);
           }
          return updateCampaignCB(null, updatedCampaign);
         });
       });
     });
   };

   /**
    * update campaign status to In Progress if no followUps
     * @param  {Object} updateProperties
     * @param  {campaign} campaign
     * @param  {Function} statusByCampaignCB
     * @author Rahul Khandelwal
    */
  const statusByCampaign = (updateProperties, campaign, statusByCampaignCB) => {
    let statusArray = [statusCodes.campaignSent,
      statusCodes.campaignStopped];
    lodash.times(constants.EIGHT, (index) => {
      ++index;
      let result = "followUpStopped-" + index;
      statusArray.push(statusCodes[result]);
      result = "followUpResumed-" + index;
      statusArray.push(statusCodes[result]);
    });
    let containsCheck = lodash.includes(statusArray, campaign.statusCode);
    if(!containsCheck) {
      updateProperties.statusCode = statusCodes.executingCampaign;
    }
    return statusByCampaignCB(null, updateProperties);
  };

  /**
   * update campaign status based on campaign metric
    * @param  {Object} updateProperties
    * @param  {campaignMetric} campaignMetric
    * @param  {object} followUps
    * @param  {Function} statusByCampaignMetricCB
    * @author Rahul Khandelwal
   */
  const statusByCampaignMetric = (updateProperties,
    campaignMetric, followUps, statusByCampaignMetricCB) => {
    if(campaignMetric) {
      if(campaignMetric.assembled ===
          (campaignMetric.sentEmails + campaignMetric.failedEmails)) {
        updateProperties.isSent = true;
        let campStatus = statusCodes.campaignSent;
        if(!followUps)
          campStatus = statusCodes.campaignExecuted;
        updateProperties.statusCode = campStatus;
      }
    }
    return statusByCampaignMetricCB(null, updateProperties);
  };

  /**
   * update campaign status based on followUp metric
    * @param  {Object} updateProperties
    * @param  {followUpMetric} followUpMetric
    * @param  {object} followUps
    * @param  {Function} statusByFollowUpMetricCB
    * @author Rahul Khandelwal
   */
  const statusByFollowUpMetric = (updateProperties,
    followUpMetric, followUps, statusByFollowUpMetricCB) => {
      if(followUpMetric) {
        let followUpsTmp = lodash.filter(followUps, (o) => {
          return (o.statusCode !== statusCodes.followUpSent)
            ? true : false;
        });
        if(followUpsTmp.length === constants.ONE
            && followUpsTmp[0].id === followUpMetric.followUpId) {
          if(followUpMetric.assembled ===
              (followUpMetric.sentEmails + followUpMetric.failedEmails)) {
            updateProperties.statusCode = statusCodes.campaignExecuted;
          }
        }
      }
      return statusByFollowUpMetricCB(null, updateProperties);
  };

 /**
  * update followUp status on deleting failed email
  *
  * @param  {Object} emailQueue
  * @param  {CampaignMetric} campaignMetric
  * @param  {FollowUpMetric} followUpMetric
  * @param  {Function} updateFollowUpCB
  * @author Rahul Khandelwal
  */
 const updateFollowUp = (emailQueue, campaignMetric, followUpMetric,
     updateFollowUpCB) => {
   if(!emailQueue.followUpId) return updateFollowUpCB(null);
   if(followUpMetric.assembled ===
       (followUpMetric.sentEmails + followUpMetric.failedEmails)) {
     EmailQueue.app.models.followUp.findById(emailQueue.followUpId,
       (followUpErr, followUp) => {
       if(followUpErr){
         logger.error("Error while finding followup",
         {error: followUpErr, stack: followUpErr.stack, input:
           {id: emailQueue.followUpId}});
         return updateFollowUpCB(followUpErr);
       }
       let updateProperties = {
         statusCode: statusCodes.followUpSent
       };
       followUp.updateAttributes(updateProperties, (updatePropertiesErr,
         updatedFollowUp) => {
         if(updatePropertiesErr){
           logger.error("Error while updating followups",
           {error: updatePropertiesErr, stack: updatePropertiesErr.stack, input:
             {updateProperties: updateProperties}});
             return updateFollowUpCB(updatePropertiesErr);
         }
         return updateFollowUpCB(null, updatedFollowUp);
       });
     });
   } else {
    return updateFollowUpCB(null);
   }
 };

  /**
   * destroys  the emails using ids and userID
   *
   * @param  {[Array[Number]]}  ids  [emailQueueIds]
   * @param  {[number]}   userId   [current userId]
   * @param  {[EmailQueue]}   emails   [email objects from queue]
   * @param  {[type]} destroyCB [description]
   * @return {[type]}           [description]
   * @author Ramanavel Selvaraju
   */
  const deleteEmailsFromQueue = (ids, userId, emails, destroyCB) => {
    EmailQueue.destroyAll({and: [{id: {inq: ids}}, {userId: userId}]
    }, (emailDestroyErr, emails) => {
      if(emailDestroyErr){
        logger.error({error: emailDestroyErr, stack: emailDestroyErr.stack,
                      input: {ids: ids, userId: userId}});
      }
      return destroyCB(emailDestroyErr);
    });
  };

  /**
   * Delete the email queue when the campaign updates
   * - from destroyCampaignElements process
   * @param  {[campaign]} campaign
   * @param  {[function]} destroyByCampaignCB
   * @author Aswin Raj
   */
  EmailQueue.destroyByCampaign = (campaign, destroyByCampaignCB) => {
    EmailQueue.app.models.campaign.findById(campaign.id,
      (campaignFindErr, campaign) => {
      if(campaignFindErr){
        logger.error("Error while finding campaign", {
          input:{campaignId: campaign.id}, error: campaignFindErr,
          stack: campaignFindErr.stack});
        return destroyByCampaignCB(campaignFindErr);
      }
      campaign.emailQueues.destroyAll((emailQueueDestroyErr) => {
        if(emailQueueDestroyErr){
          logger.error("Error while destroying emailsQueue for campaign: ",
          {error: emailQueueDestroyErr, stack: emailQueueDestroyErr.stack});
          return destroyByCampaignCB(emailQueueDestroyErr);
        }
        return destroyByCampaignCB(null, "Deleted successfully!");
      });
    });
  };

  /**
   * destoys the emails associated with the followup from the email queue
   *
   * @param  {FollowUp}   followup
   * @param  {Function} callback
   * @return {void}
   * @author Ramanavel Selvaraju
   */
  EmailQueue.destroyByFollowUp = (followUp, destroyByFollowUpCB) => {
    followUp.emailQueues.destroyAll((emailQueueDestroyErr) => {
      if(emailQueueDestroyErr){
        logger.error("Error while destroying emailsQueue for FollowUp: ",
        {input: {followUpId: followUp.id},
          error: emailQueueDestroyErr, stack: emailQueueDestroyErr.stack});
        return destroyByFollowUpCB(emailQueueDestroyErr);
      }
      return destroyByFollowUpCB(null, "Deleted successfully!");
    });
  };

  EmailQueue.remoteMethod(
    "scheduledMails", {
      description: "Get Scheduled Mails",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "campaignId", type: "number"},
        {arg: "start", type: "number"},
        {arg: "limit", type: "number"}
      ],
      returns: {arg: "CampaignAudit", type: "array", root: true},
      http: {verb: "get", path: "/scheduledMails/campaign/:campaignId"}
    }
  );
  /**
   * Method to return sent mails
   * @param  {Object}   ctx
   * @param  {Integer}   campaignId
   * @param  {Integer}   start
   * @param  {Integer}   limit
   * @param  {Function} callback
   * @return {[Object]} list of Campaign Audit
   * @author Syed Sulaiman M, Rahul Khandelwal(modified)
   */
  EmailQueue.scheduledMails = (ctx, campaignId, start, limit, callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit);
    if (errorMessage) {
      return callback(errorMessage);
    }
    EmailQueue.find({
      where: {
        campaignId: campaignId
      },
      order: "scheduledAt ASC",
      limit: limit,
      skip: start
    }, (emailQueuesErr, emailQueues) => {
      let responses = [];
      async.each(emailQueues, (emailQueue, emailQueueCB) => {
        emailQueue.person((personErr, person) => {
          let response = JSON.parse(JSON.stringify(emailQueue));
          response.content = response.content
          .replace(/<a class=("|')(unsubscribe)(.*?)(>)/g, "<a href='#'>");
          response.person = {
            firstName: person.firstName,
            middleName: person.middleName,
            lastName: person.lastName,
            email: person.email,
            timeZone: person.timeZone
          };
          responses.push(response);
          emailQueueCB(null);
        });
      }, (error) => {
        return callback(null, responses);
      });
    });
  };

  /**
   * Method To validate mail request
   * @param  {Number} campaignId
   * @param  {Number} start
   * @param  {Number} limit
   * @return {Object}
   * @author Syed Sulaiman M
   */
  const validateMailRequest = (campaignId, start, limit) => {
    const zero = 0;
    let errorMessage = null;
    if (campaignId <= zero) {
      errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
    } else if (start < zero) {
      errorMessage = errorMessages.INVALID_START;
    } else if (limit <= zero) {
      errorMessage = errorMessages.INVALID_LIMIT;
    }
    return errorMessage;
  };

  /**
   * Method to get Mails that are scheduled to be sent
   * 		and is not in Error and not Stopped
   *
   * @param  {Function} callback [description]
   * @return {Object} Email Queue Objects
   * @author Syed Sulaiman M
   */
  EmailQueue.getMailsToSent = (callback) => {
    EmailQueue.find({
      where: {
        scheduledAt: {
          lte: Date.now()
        },
        isError: false,
        isStopped: false
      },
      limit: 100
    }, (queuedMailsErr, queuedMails) => {
      if(queuedMailsErr) {
        logger.error("Error while finding emailQueue", {
          error: queuedMailsErr, stack: queuedMailsErr.stack});
      }
      return callback(queuedMailsErr, queuedMails);
    });
  };

  EmailQueue.updateInst = (emailQueue, emailQueueUpdateElements, callback) => {
    emailQueue.updateAttributes(emailQueueUpdateElements,
      (updateErr, updatedInst) => {
      if(updateErr) {
        logger.error("Error while updating emailQueue", {
          input:{queueObj: emailQueueUpdateElements},
          error: updateErr, stack: updateErr.stack});
      }
      return callback(updateErr, updatedInst);
    });
  };

//npm run calls
/**
 * Constructing the individual emails and save in the email queue table
 * This will take care of common templates,
 * person wise templates and missing tag wise templates
 * and also support the multiple common templates.
 * Multiple common templates will be taken as round robin order
 *
 * @param  {[number]} campaignId [description]
 * @param  {[function]} assembleEmailsCB [callback function]
 * @return {[string]} [success message]
 * @author Ramanavel Selvaraju
 */
EmailQueue.assembleEmails = (campaign, assembleEmailsCB) => {
  async.series([
    async.apply(EmailQueue.destroyByCampaign, campaign),
    async.apply(EmailQueue.app.models.campaign.updateStatusCode,
                  campaign, statusCodes.processing),
    async.apply(EmailQueue.app.models.campaignMetric.createMetricsOnGen,
                  campaign),
    async.apply(EmailQueue.app.models.list.getListAndSaveEmail,
                  campaign, null),
    async.apply(EmailQueue.app.models.campaign.updateStatusCode,
                 campaign, statusCodes.readyToSend),
  ], (getPoepleAndGenerateEmailErr, results) => {
    return assembleEmailsCB(getPoepleAndGenerateEmailErr,
      "Generated emails for campaignId:" + campaign.id);
  });
  //campaign.findById
};

/**
 * Checks the email is already generated or not. for that we have to find
 * EmailQueue model with campaignId and personId and followUpId
 *
 * @param  {[Campaign]} campaign           [current campaign Object]
 * @param  {[Person]} person
 * @param  {[function]} checkEmailExistsCB [callback]
 * @return {[boolean]}[if email Exists return true else it will return false]
 * @author Ramanavel Selvaraju
 */
EmailQueue.checkEmailExists = (campaign, followup, person, emailExistsCB) => {

  EmailQueue.find({where: {and: [{campaignId: campaign.id},
    {personId: person.id}, {followUpId: followup ? followup.id : null}]}
  }, (checkEmailExistsFindErr, emails)=>{
    if(checkEmailExistsFindErr) {
      logger.error("Check Email Exists in EmailQueue Find Error", {
        error: checkEmailExistsFindErr,
        campaign: campaign,
        person: person,
        stack: checkEmailExistsFindErr.stack
      });
      return emailExistsCB(checkEmailExistsFindErr);
    }
  return emailExistsCB(null, lodash.isEmpty(emails));
  }); //EmailQueue.find
}; //checkEmailExists



//observers
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  EmailQueue.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
