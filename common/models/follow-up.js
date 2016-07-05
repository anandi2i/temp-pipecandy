"use strict";

import async from "async";
import logger from "../../server/log";
import moment from "moment-timezone";

module.exports = function(FollowUp) {

/**
 * To update each of the followUps for the current campaign with the scheduled date
 * @param  {[campaignId]} campaignId
 * @param  {[function]} prepareScheduledAtCB
 * @return void
 * @author Aswin Raj A
 */
FollowUp.prepareScheduledAt = (campaignId, prepareScheduledAtCB) => {
  FollowUp.app.models.find({
    where : {
      campaignId : campaignId
    },
    order: "stepNo ASC",
  }, (followUpsFindErr, followUps) => {
    if(followUpsFindErr || !followUps.length){
      logger.error("Error while finding followups", {error: followUpsFindErr,
        stack: followUpsFindErr.stack});
      return prepareScheduledAtCB(followUpsFindErr);
    }
    let previousScheduledDate = null;
    async.eachSeries(followUps, (followUp, followUpCB) => {
      async.waterfall([
        function setParams(setParamsCB) {
          setParamsCB(null, followUp, campaignId, previousScheduledDate);
        },
        getPreviousScheduledDate,
        calculateNextFollowupdate,
        updateFollowUp
      ], (asyncErr, result) => {
        if(asyncErr){
          logger.error("Error while updating followups", {error: asyncErr,
            stack: asyncErr.stack});
          return followUpCB(asyncErr);
        }
        followUpCB(null);
      });
    }, (asyncErr) => {
      if(asyncErr){
        logger.error("Error while updating followups", {error: asyncErr,
          stack: asyncErr.stack});
        prepareScheduledAtCB(asyncErr);
      }
      prepareScheduledAtCB(null);
    });
  });
};

/**
 * Method to get Follows To Be Sent
 *
 * @param  {Function} callback
 * @return {[FollowUp]}   List of Follow Ups to Sent
 * @author Syed Sulaiman M
 */
FollowUp.getFolloUpsToSent = (callback) => {
  FollowUp.find({
    where: {
      scheduledAt: {
        lte: Date.now()
      },
      isFollowUpGenerated: false,
      isStopped: false
    },
    limit: 100
  }, function(followUpsErr, followUps) {
    callback(followUpsErr, followUps);
  });
};

/**
 * To get the previousScheduledDate for the current follow up,
 * if previousScheduledDate is not empty, use it
 * if previousScheduledDate is empty, use the campaign's scheduled date
 * @param  {[followUp]} followUp
 * @param  {[campaignId]} campaignId
 * @param  {[function]} getPreviousScheduledDateCB
 * @return {[previousScheduledDate, followUp]}
 * @author Aswin Raj A
 */
const getPreviousScheduledDate = (followUp, campaignId, previousScheduledDate,
  getPreviousScheduledDateCB) => {
  if(previousScheduledDate){
    return getPreviousScheduledDateCB(null, previousScheduledDate, followUp);
  }
  FollowUp.app.models.campaign.findById(campaignId,
    (campaignfindErr, campaign) => {
    if(campaignfindErr){
      logger.error("Error while finding campaign",
      {error: campaignfindErr, stack: campaignfindErr.stack});
      return getPreviousScheduledDateCB(campaignfindErr);
    }
    previousScheduledDate = campaign.scheduledAt;
    getPreviousScheduledDateCB(null, previousScheduledDate, followUp);
  });
};

/**
 * Calculate the next followUp date
 * get the scheduledDate and add the number of days to it and append the time to it
 * convert the datetime to system timezone using moment
 * @param  {[scheduledDate]} scheduledDate
 * @param  {[followUp]} followUp
 * @param  {[function]} calculateNextFollowupdateCB
 * @return {[nextFolloupDate]}
 * @author Aswin Raj A
 */
const calculateNextFollowupdate = (scheduledDate, followUp,
  calculateNextFollowupdateCB) => {
  const systemTimeZone = moment().format("Z");
  try {
    const one = 1;

    const formatedDate = new Date(scheduledDate);
    const newDate = moment([formatedDate.getFullYear(),
      formatedDate.getMonth()+one, formatedDate.getDate()])
                    .add(followUp.days, 'days').format();
    const newformatedDate = new Date(newDate);
    const dateString = (newformatedDate.getMonth()+one) + " " +
    newformatedDate.getDate() + " " + newformatedDate.getFullYear();
    const newFollowupDate = new Date(dateString + " " + followUp.time +
    " " + systemTimeZone);

    previousScheduledDate = newFollowupDate;
    calculateNextFollowupdateCB(null, followUp, previousScheduledDate);

  } catch (err) {
    logger.error("FollowUp date calculation error", {error: err,
      stack: err.stack});
    return calculateNextFollowupdateCB(err);
  }

};

/**
 * Update the followUp with the calculate nextfollowUpDate
 * @param  {[followUp]} followUp
 * @param  {[followUpScheduledDate]} followUpScheduledDate
 * @param  {[function]} updateFollowUpCB
 * @author Aswin Raj A
 */
const updateFollowUp = (followUp, followUpScheduledDate, updateFollowUpCB) => {
  followUp.updateAttribute(scheduledAt, followUpScheduledDate,
    (followUpUpdateErr, updatedFollowup) => {
      if(followUpUpdateErr){
        logger.error("Error while updating followUps",
        {error: followUpUpdateErr, stack: followUpUpdateErr.stack});
        return updateFollowUpCB(followUpUpdateErr);
      }
      updateFollowUpCB(null);
  });
};

/**
 * Delete the followups when the campaign updates
 * - from destroyCampaignElements process
 * @param  {[campaign]} campaign
 * @param  {[function]} destroyByCampaignCB
 */
FollowUp.destroyByCampaign = (campaign, destroyByCampaignCB) => {
  campaign.followUps.destroyAll((followUpsDestroyErr) => {
    if(followUpsDestroyErr){
      logger.error("Error while destroying followups for campaign: ",
       {error: followUpsDestroyErr, stack: followUpsDestroyErr.stack});
      return destroyByCampaignCB(followUpsDestroyErr);
    }
    return destroyByCampaignCB(null, "Deleted successfully!");
  });
};


/**
 * Create the followup and create the campaign template for the followup
 * @param  {[campaign]} campaign
 * @param  {[followUpObjects]} followUpObjects
 * @param  {[function]} createFollowUpsCB
 */
FollowUp.createFollowUpElements = (campaign, followUpObjects,
  createFollowUpsCB) => {
  async.eachSeries(followUpObjects, (followUpObj, followUpCB) => {
    async.waterfall([
      async.apply(createFollowup, campaign, followUpObj),
      createCampaignTemplate
    ], (asyncErr, result) => {
      if(asyncErr){
        return followUpCB(asyncErr);
      }
      return followUpCB(null);
    });
  }, (asyncErr) => {
    if(asyncErr){
      logger.error("Error on saving followUp elements : ",
      {error: asyncErr, stack: asyncErr.stack});
      return createFollowUpsCB(asyncErr);
    }
    return createFollowUpsCB(null);
  });
};


/**
 * Create the followUp for the current campaign, as per what is got from
 * the reqParam
 * @param  {[campaign]} campaign
 * @param  {[followUpObj]} followUpObj
 * @param  {[function]} createFollowupCB
 * @return {[createdFollowUp, campaign, followUpObj]}
 */
const createFollowup = (campaign, followUpObj, createFollowupCB) => {
  followUpObj.followUp.campaignId = campaign.id;
  FollowUp.create(followUpObj.followUp,
    (followUpCreateErr, createdFollowUp) => {
    if(followUpCreateErr){
      logger.error("Error while creating followUp : ",
      {error: followUpCreateErr, stack: followUpCreateErr.stack});
      return createFollowupCB(followUpCreateErr);
    }
    return createFollowupCB(null, createdFollowUp, campaign,
      followUpObj.campaignTemplates);
  });
};


/**
 * For the current followUp, create the CampaignTemplate for the current
 * campaign
 * @param  {[createdFollowUp]} createdFollowUp
 * @param  {[campaign]} campaign
 * @param  {[campaignTemplatesObject]} campaignTemplates
 * @param  {[function]} createCampaignTemplateCB
 */
const createCampaignTemplate = (createdFollowUp, campaign,
  campaignTemplatesObject, createCampaignTemplateCB) => {
  let updatedCampaignTemplate = campaignTemplatesObject
  .map((campaignTemplate) => {
    campaignTemplate.campaignId = campaign.id;
    return campaignTemplate;
  });
  createdFollowUp.campaignTemplate.create(updatedCampaignTemplate,
    (campaignTemplatesCreateErr, createdCampaignTemplate) => {
      if(campaignTemplatesCreateErr){
        logger.error("Error while createign campaignTemplate : ",
        {error: campaignTemplatesCreateErr,
          stack: campaignTemplatesCreateErr.stack});
        return createCampaignTemplateCB(campaignTemplatesCreateErr);
      }
      return createCampaignTemplateCB(null);
  });
};

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  FollowUp.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
