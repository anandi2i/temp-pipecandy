"use strict";

import async from "async";
import lodash from "lodash";
import logger from "../../server/log";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import statusCodes from "../../server/utils/status-codes";

module.exports = function(EmailQueue) {

  EmailQueue.remoteMethod(
    "deletePeople", {
      description: "Deletes people assoiciate with campagin from EmailQueue",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}},
                {arg: "reqParams", type: "object", http: {source: "body"}}],
      returns: {arg: "person", type: "person", root: true},
      http: {verb: "delete", path: "/people"}
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
     deleteEmailsFromQueue
    ], (asyncErr) => {
      if(asyncErr) {
        return deletePeopleCB(userrorMessages.SERVER_ERROR);
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
    campaign.emailQueues.destroyAll((emailQueueDestroyErr) => {
      if(emailQueueDestroyErr){
        logger.error("Error while destroying emailsQueue for campaign: ",
        {error: emailQueueDestroyErr, stack: emailQueueDestroyErr.stack});
        return destroyByCampaignCB(emailQueueDestroyErr);
      }
      return destroyByCampaignCB(null, "Deleted successfully!");
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
   * @author Syed Sulaiman M
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
      order: "createdAt DESC",
      limit: limit,
      skip: start
    }, (emailQueuesErr, emailQueues) => {
      let responses = [];
      async.each(emailQueues, (emailQueue, emailQueueCB) => {
        emailQueue.person((personErr, person) => {
          let response = JSON.parse(JSON.stringify(emailQueue));
          response.person = {
            firstName: person.firstName,
            middleName: person.middleName,
            lastName: person.lastName,
            email: person.email,
            timeZone: person.time_zone
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
      return callback(queuedMailsErr, queuedMails);
    });
  };

  EmailQueue.updateInst = (emailQueue, emailQueueUpdateElements, callback) => {
    emailQueue.updateAttributes(emailQueueUpdateElements,
          (updateErr, updatedInst) => {
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
      "Generated emails for campginId:" + campaign.id);
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
