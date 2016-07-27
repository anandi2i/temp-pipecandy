"use strict";

import async from "async";
import lodash from "lodash";
import logger from "../../server/log";
import moment from "moment-timezone";

module.exports = function(FollowUp) {

  /**
   * return a json with folloup and step number
   * @param  {[number]} campaignId
   * @param  {[function]} getStepNoCB [callback]
   * @return {[json]} {followUpId: StepNo }
   * @author Ramanavel Selvaraju
   */
  FollowUp.getFollowupStepNo = (campaignId, getStepNoCB) => {
    FollowUp.find({where : {campaignId: campaignId}},
      (followUpsFindErr, followUps) => {
        if(followUpsFindErr) {
          logger.error({error: followUpsFindErr, stack: followUpsFindErr.stack,
                        input: {campaignId: campaignId}});
          return getStepNoCB(followUpsFindErr);
        }
        if(lodash.isEmpty(followUps)){
          return getStepNoCB(null, null);
        }//passing null because we can check this campagin doen't have any followup
        let stepNos = {};
        lodash(followUps).forEach(function(followup) {
          stepNos[followup.id] = followup.stepNo;
        });
        return getStepNoCB(null, stepNos);
    });
  };

/**
 * To update each of the followUps for the current campaign with the scheduled date
 * @param  {[campaignId]} campaignId
 * @param  {[function]} prepareScheduledAtCB
 * @return void
 * @author Aswin Raj A
 */
FollowUp.prepareScheduledAt = (campaignId, prepareScheduledAtCB) => {
  FollowUp.find({
    where : {
      campaignId : campaignId
    },
    order: "stepNo ASC",
  }, (followUpsFindErr, followUps) => {
    if(followUpsFindErr || lodash.isEmpty(followUps)){
      logger.error("Error while finding followups", {error: followUpsFindErr,
        stack: followUpsFindErr ? followUpsFindErr.stack : null});
      const notFound = "Campaign not Found";
      return prepareScheduledAtCB(followUpsFindErr,
          new Error(notFound));
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
      ], (asyncErr, newFollowupDate) => {
        if(asyncErr){
          logger.error("Error while updating followups", {error: asyncErr,
            stack: asyncErr.stack});
          return followUpCB(asyncErr);
        }
        previousScheduledDate = newFollowupDate;
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
 * Update the followUp isStopped flag value
 * @param  {[followUp]} followUp
 * @param  {[followUpScheduledDate]} followUpScheduledDate
 * @param  {[function]} updateFollowUpCB
 * @author Syed Sulaiman M
 */
FollowUp.updateStoppedByCampaignId = (campaignId, isStopped, callback) => {
  FollowUp.updateAll({
    campaignId : campaignId
  }, {
    isStopped : isStopped
  }, (updateErr, info) => {
    if(updateErr) {
      logger.error("Error while updating followUps",
        {error: updateErr, stack: updateErr.stack,
          input: {campaignId: campaignId}});
      return callback(updateErr);
    }
    return callback(null, info);
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
    scheduledDate = scheduledDate ? scheduledDate : new Date();
    const formatedDate = new Date(scheduledDate);
    const newDate = moment([formatedDate.getFullYear(),
      formatedDate.getMonth(), formatedDate.getDate()])
                .add(followUp.daysAfter, "days").format("YYYY-MM-DDTHH:mm:ss");
    const newformatedDate = new Date(newDate);
    const dateString = (newformatedDate.getMonth()+one) + " " +
    newformatedDate.getDate() + " " + newformatedDate.getFullYear();
    const newFollowupDate = new Date(dateString + " " + followUp.time +
    " " + systemTimeZone);

    calculateNextFollowupdateCB(null, followUp, newFollowupDate);
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
  followUp.updateAttribute("scheduledAt", followUpScheduledDate,
    (followUpUpdateErr, updatedFollowup) => {
      if(followUpUpdateErr){
        logger.error("Error while updating followUps",
        {error: followUpUpdateErr, stack: followUpUpdateErr.stack});
        return updateFollowUpCB(followUpUpdateErr);
      }
      updateFollowUpCB(null, followUpScheduledDate);
  });
};

/**
 * Delete the followups when the campaign updates
 * - from destroyCampaignElements process
 * @param  {[campaign]} campaign
 * @param  {[function]} destroyByCampaignCB
 * @author Aswin Raj A
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
 * @author Aswin Raj A
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
  let updatedCampaignTemplate;
  if(Array.isArray(campaignTemplatesObject)) {
    updatedCampaignTemplate = campaignTemplatesObject.map(
        (campaignTemplate) => {
          campaignTemplate.campaignId = campaign.id;
          return campaignTemplate;
    });
  } else {
    campaignTemplatesObject.campaignId = campaign.id;
    updatedCampaignTemplate = campaignTemplatesObject;
  }
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

//npm run calls
  /**
   * Constructing the followup emails and save in the email queue table
   * This will take care of common templates,
   * person wise templates and missing tag wise templates
   * and also support the multiple common templates.
   * checks wether the person is eligible for followup using campaignAudit model
   * isFollowupEligible property
   *
   * @param  {[number]} campaignId [description]
   * @param  {[function]} assembleEmailsCB [callback function]
   * @return {[string]} [success message]
   * @author Ramanavel Selvaraju
   */
  FollowUp.assembleEmails = (followup, assembleEmailsCB) => {

    followup.campaign((campaignErr, campaign) => {

      if(campaignErr) {
       logger.error("Error on FollowUp.assembleEmails : ",
          {followup: followup, error: campaignErr, stack: campaignErr.stack});
       return assembleEmailsCB(campaignErr);
      }

      FollowUp.app.models.list.getListAndSaveEmail(campaign, followup,
      (getPoepleAndGenerateEmailErr) => {
        return assembleEmailsCB(getPoepleAndGenerateEmailErr,
          "Generated emails for followup:" + followup);
      });//list.getListAndSaveEmail

    });//followup.campaign

  };

  /**
   * get the campaign email to get the subject from the campagin audit
   * inorder to get the thread view gmail and other mail clients are using same
   * subject. We are returning the complete campaign audit object
   * Here we are assuming campaignAudit will have one object peruser percampaign
   *
   * @param  {[Campaign]} campaign
   * @param  {[Person]} person
   * @param  {[FollowUp]} followup
   * @param  {[EmailQueue]} email        [emailQueue Object]
   * @param  {[fucntion]} preapreSubjectCB [callback]
   * @return {[CampaignAudit]}        [campaignAudit[0]]
   * @author Ramanavel Selvaraju
   */
  FollowUp.preapreSubject = (campaign, person, followup, email,
    preapreSubjectCB) => {
      FollowUp.app.models.campaignAudit.find({where: {and: [
        {personId: person.id}, {campaignId: campaign.id}, {followUpId: null}
      ]}
      }, (campaignAuditErr, campaignAudit) => {
        if(campaignAuditErr || lodash.isEmpty(campaignAudit)) {
          logger.error({
            error: campaignAuditErr ? campaignAuditErr : "Audit not found",
            stack: campaignAuditErr ? campaignAuditErr.stack : "",
            email: email
          });
          return preapreSubjectCB(campaignAuditErr);
        }
        return preapreSubjectCB(null, campaignAudit[0]);
      });
    };

  /**
   * Constructs the reply email using old emails like gmail threaded view
   *
   * @param  {[campaign]} campaign
   * @param  {[person]} person
   * @param  {[followup]} followup
   * @param  {[EmailQueue]} email
   * @param  {[function]} preapreContentCB
   * @author Ramanavel Selvaraju
   */
  FollowUp.preapreContent = (campaign, person, followup, email,
    preapreContentCB) => {
      FollowUp.app.models.campaignAudit.find({where: {and: [
        {personId: person.id}, {campaignId: campaign.id}
      ]},
      order: "createdAt DESC",
      limit: 1
      }, (campaignAuditErr, campaignAudit) => {
        if(campaignAuditErr || lodash.isEmpty(campaignAudit)) {
          logger.error({
            error: campaignAuditErr ? campaignAuditErr : "Audit not found",
            stack: campaignAuditErr ? campaignAuditErr.stack : "",
            email: email
          });
          return preapreContentCB(campaignAuditErr);
        }
        const sentAt = moment(campaignAudit[0].createdAt);
        let content = "";
        content += `<div>On ${sentAt.format(("ddd, MMM DD, YYYY"))} `;
        content += `at ${sentAt.format(("h:mm A"))}, `;
        content += `&lt;${campaignAudit[0].fromEmail}&gt; wrote:</div>`;
        const blackQuote = `<blockquote class="gmail_quote"
        style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex">`;
        content += blackQuote;
        content += campaignAudit[0].content;
        content += "</blockquote>";
        return preapreContentCB(null, content);
      });
  };

  /**
   * API to reSchedule the followUps with the new date from now
   * @param  {[campaignId]} campaignId
   * @param  {[function]} reScheduleCB
   * @return {[result]}
   * @author Aswin Raj A
   */
  FollowUp.reScheduleFollowUps = (campaignId, reScheduleCB) => {
    async.waterfall([
      getAllFollowUpsForCampaign,
      scheduleFollowUps
    ], (asyncErr, result) => {
      reScheduleCB(asyncErr, result);
    });
  };

  /**
   * Get all the followUps for the current campaign id
   * @param  {[campaignId]} campaignId
   * @param  {[function]} getFolloupsCB
   * @return {[followUps]}
   * @author Aswin Raj A
   */
  const getAllFollowUpsForCampaign = (campaignId, getFolloupsCB) => {
    FollowUp.find({
      where : {
        campaignId: campaignId
      }
    }, (followUpsFindErr, followUps) => {
      if(followUpsFindErr || lodash.isEmpty(followUps)){
        const errParam = followUpsFindErr || new Error("No followUps for the\
          campaign");
        logger.error(errParam.msg, {
          input: {campaignId: campaignId},
          stack: followUpsFindErr ? followUpsFindErr.stack : ""
        });
        return getFolloupsCB(followUpsFindErr);
      }
      return getFolloupsCB(null, followUps);
    });
  };


  /**
   * To update all the followUps with the new followUp date
   * @param  {[followUps]} followUps
   * @param  {[campaign]} campaign
   * @param  {[scheduleCB]} scheduleCB
   * @return {[response]}
   * @author Aswin Raj A
   */
  const scheduleFollowUps = (followUps, campaign, scheduleCB) => {
    let oldScheduledDate = null;
    async.eachSeries(followUps, (followUp, followUpCB) => {
      async.waterfall([
        async.apply(calculateNextFollowupdate, oldScheduledDate, followUp),
        updateFollowUp
      ], (asyncErr, prevFollowUpDate) => {
        if(asyncErr) return followUpCB(asyncErr);
        oldScheduledDate = prevFollowUpDate;
        return followUpCB(null);
      });
    }, (eachSeriesErr) => {
      if(eachSeriesErr) return scheduleCB(eachSeriesErr);
      return scheduleCB(null, "Scheduled followUps successfully!");
    });
  };

//observers
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
