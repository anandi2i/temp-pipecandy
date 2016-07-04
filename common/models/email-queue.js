"use strict";

import moment from "moment-timezone";
import lodash from "lodash";
import logger from "../../server/log";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(EmailQueue) {

  /**
   * builds the Email Queue Object and saving in the Email Queue table
   * @param  person
   * @param  campaign
   * @param  campaignTemplate
   * @param  function saveEmailQueueCB
   * @return void
   */
  EmailQueue.push = (campaign, person, campaignTemplate, email,
     saveEmailQueueCB) => {
    prepareScheduledAt(campaign, person, (prepareScheduledAtErr,
                                                          scheduledAt) => {
      if (prepareScheduledAtErr) {
        saveEmailQueueCB(prepareScheduledAtErr);
      }
      let emailQueue = {
        email: person.email,
        content: email.content,
        subject: email.subject,
        campaignTemplateId: campaignTemplate.id,
        campaignId: campaignTemplate.campaignId,
        userId: campaign.createdBy,
        personId: person.id,
        scheduledAt: scheduledAt
      };

      EmailQueue.create(emailQueue, (emailQueueErr, emailQueueObj) => {
        if (emailQueueErr) {
          saveEmailQueueCB(emailQueueErr);
        }
        logger.info("Pushed Email to the Queue", emailQueueObj);
        saveEmailQueueCB();
      });
    });
  };

  /**
   * Preparering ScheduledAt for Individual
   *
   * @param campaign
   * @param person
   * @param function prepare ScheduledAt Callback
   * @return void
   */
  let prepareScheduledAt = (campaign, person, prepareScheduledAtCB) => {
    let scheduledAt = new Date();
    try {
      if (campaign.scheduledAt) {
        if (person.time_zone) {
          var personZoneTime = moment(campaign.scheduledAt)
                            .tz(person.time_zone).format("YYYY-MM-DDTHH:mm:ss");
          var systemTimeZone = moment().format("Z");
          personZoneTime += systemTimeZone;
          scheduledAt = new Date(personZoneTime);
        } else {
          scheduledAt = campaign.scheduledAt;
        }
      }
      prepareScheduledAtCB(null, scheduledAt);
    } catch (prepareScheduledAtERR) {
      prepareScheduledAtCB(prepareScheduledAtERR);
    }
  };

  /**
   * Delete the email queue when the campaign updates
   * - from destroyCampaignElements process
   * @param  {[campaign]} campaign
   * @param  {[function]} destroyByCampaignCB
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
  EmailQueue.assembleEmails = (campaignId, assembleEmailsCB) => {

    EmailQueue.app.models.campaign.findById(campaignId,
      (campaignErr, campaign) => {

      if(campaignErr | lodash.isEmpty(campaign)) {
       logger.error("Error in getting campaign for id : ",
            {campginId: campaignId, error: campaignErr});
       return assembleEmailsCB(campaignErr);
      }

      EmailQueue.app.models.list.getListAndSaveEmail(campaign,
      (getPoepleAndGenerateEmailErr) => {
        return assembleEmailsCB(getPoepleAndGenerateEmailErr,
          "Generated emails for campginId:" + campaignId);
      });//list.getListAndSaveEmail

    });//campaign.findById

  };

  /**
   * Checks the email is already generated or not. for that we have to find
   * EmailQueue model with campaignId and personId
   * @param  {[Campaign]} campaign           [current campaign Object]
   * @param  {[Person]} person
   * @param  {[function]} checkEmailExistsCB [callback]
   * @return {[boolean]}[if email Exists return true else it will return false]
   * @author Ramanavel Selvaraju
   */
  EmailQueue.checkEmailExists = (campaign, person, checkEmailExistsCB) => {

    EmailQueue.find({where: {and: [{campaignId: campaign.id},
      {personId: person.id}]}}, (checkEmailExistsFindErr, emails)=>{

      if(checkEmailExistsFindErr) {
        logger.error("Check Email Exists in EmailQueue Find Error", {
          error: checkEmailExistsFindErr,
          campaign: campaign,
          person: person
        });
        return checkEmailExistsCB(checkEmailExistsFindErr);
      }
    return checkEmailExistsCB(null, lodash.isEmpty(emails) ? false : true);

    }); //EmailQueue.find

  }; //checkEmailExists

  EmailQueue.remoteMethod(
    "scheduledMails", {
      description: "Get Scheduled Mails",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "campaignId",
        type: "number"
      }, {
        arg: "start",
        type: "number"
      }, {
        arg: "limit",
        type: "number"
      }],
      returns: {
        arg: "CampaignAudit",
        type: "array",
        root: true
      },
      http: {
        verb: "get",
        path: "/scheduledMails/:campaignId/:start/:limit"
      }
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
      if (lodash.isEmpty(emailQueues)) {
        const errorMessage = errorMessages.NO_EMAILS_FOUND;
        return callback(errorMessage);
      }
      let scheduledMails = {};
      scheduledMails.mails = emailQueues;
      return callback(null, scheduledMails);
    });
  };

  /**
   * Method To validate mail request
   * @param  {Number} campaignId
   * @param  {Number} start
   * @param  {Number} limit
   * @return {Object}
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
