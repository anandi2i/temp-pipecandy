"use strict";

import moment from "moment-timezone";
import lodash from "lodash";
import logger from "../../server/log";

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
        console.log("Pushed Email to the Queue", emailQueueObj);
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
            {campginId: id, error: parallelErr});
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
