"use strict";

var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");
var lodash = require("lodash");
var async = require("async");
var statusCodes = require("../../server/utils/status-codes");
var constants = require("../../server/utils/constants");
require("console-stamp")(console,
  {pattern : constants.default.TIME_FORMAT});

const dataSource = require(process.cwd() + "/server/server.js").dataSources
                                                                  .psqlDs;

const App = dataSource.models;
const queue= require(process.cwd() + "/server/server.js").settings.queue;

AWS.config.update({
  region: queue.config.region,
  accessKeyId: queue.config.accessKeyId,
  secretAccessKey: queue.config.secretAccessKey
});

const queueName = "emailAssembler";

/**
 * Consumer process for mail dequeue
 */
const app = Consumer.create({
  queueUrl: queue.url[queueName],
  handleMessage: function(message, done) {
    let msgBody = JSON.parse(message.Body);
    const campaign = msgBody.campaign;
    console.log("Recived Message : ", campaign);
    if(msgBody.action === "assembler"){
      assembleCampaignProcess(campaign, (err, data) => {
        if(err) return done(err);
        return done();
      });
    } else {
      resumeCampaignProcess(campaign, (err, data) => {
        if(err) return done(err);
        return done();
      });
    }
  },
  sqs: new AWS.SQS()
});

/**
 * To assemble the emails in emailQueue for the given campaign if it comes through
 * assembler
 * @param  {[campaign]} campaign
 * @param  {[function]} assembleProcessCB
 * @return {[results]}
 * @author Aswin Raj A(modified)
 */
const assembleCampaignProcess = (campaign, assembleProcessCB) => {
  App.campaign.findById(campaign.id, (campaignErr, campaign) => {
    if(campaignErr || lodash.isEmpty(campaign)) {
      console.error("Error while getting campaign", {
        error: campaignErr, input: campaign,
        stack: campaignErr ? campaignErr.stack : ""
      });
      return assembleProcessCB(campaignErr);
    }
    if(campaign.statusCode !== statusCodes.default.enqueued
      && campaign.statusCode !== statusCodes.default.campaignResumed) {
      console.error("Error while validating status for Id: ", campaign.id);
      return assembleProcessCB("Error while validating status");
    }
    async.parallel({
      emailQueue: App.emailQueue.assembleEmails.bind(null, campaign),
      followup: App.followUp.prepareScheduledAt.bind(null, campaign.id)
    }, (parallelErr, results) => {
      if(!parallelErr) {
        console.log("Assembled Emails Successfully campaignId: ", campaign.id);
      }
      return assembleProcessCB(parallelErr);
    });
  });
};

/**
 * To assemble the emails in emailQueue for the given campaign if it comes from
 * pause state to resume state
 * @param  {[campaign]} campaign
 * @param  {[function]} resumeProcessCB
 * @return {[response]}
 * @author Aswin Raj A
 */
const resumeCampaignProcess = (campaign, resumeProcessCB) => {
  const campaignScheduledDate = campaign.scheduledAt || new Date();
  const scheduledDate = new Date(campaignScheduledDate).toUTCString();
  let currentDate = new Date();
  const tomorrow = new Date(currentDate.setDate(currentDate.getDate()+
                  constants.ONE)).toUTCString();
  if(scheduledDate < tomorrow){
    updateForPastCampaign(campaign, (err, response) => {
      return resumeProcessCB(err, response);
    });
  } else {
    updateForFutureCampaign(campaign, (err, response) => {
      return resumeProcessCB(err, response);
    });
  }
};

/**
 * If a past campaign has been resumed, emailQueue and followups should be updated
 * @param  {[campaign]} campaign
 * @param  {[function]} updateForPastCampaignCB
 * @return {[response]}
 * @author Aswin Raj A
 */
const updateForPastCampaign = (campaign, updateForPastCampaignCB) => {
  async.parallel({
    emailQueue : App.emailQueue.assembleEmails.bind(null, campaign),
    followUp : App.followUp.reScheduleFollowUps.bind(null, campaign.id)
  }, (parallelErr, result) => {
    if(!parallelErr){
      console.log("Assembled Emails Successfully campaignId: ", campaign.id);
    }
    return updateForPastCampaignCB(parallelErr, "Assembled Emails Successfully\
      for past campaign");
  });
};

/**
 * If a future campaign has been resumed, emailQueue and followups should be
 * updated
 * @param  {[campaign]} campaign
 * @param  {[function]} updateForFutureCampaignCB
 * @return {[response]}
 * @author Aswin Raj A
 */
const updateForFutureCampaign = (campaign, updateForFutureCampaignCB) => {
  async.parallel({
    emailQueue: updateFutureEmailsInQueue.bind(null, campaign),
    followUp: updateFutureFollowUps.bind(null, campaign)
  }, (parallelErr, results) => {
    if(!parallelErr) {
      console.log("Assembled Emails Successfully campaignId: ", campaign.id);
    }
    return updateForFutureCampaignCB(parallelErr, "Assembled Emails\
      Successfully for future campaign");
  });
};

/**
 * Update the email in the emailQueue by setting the isStopped to false and
 * stoppedBy to null
 * @param  {[campaign]} campaign
 * @param  {[function]} updateFutureEmailsInQueueCB
 * @return {[type]}
 * @author Aswin Raj A
 */
const updateFutureEmailsInQueue = (campaign, updateFutureEmailsInQueueCB) => {
  App.emailQueue.updateAll({campaignId: campaign.id},
    {isStopped: false, stoppedBy: ""}, (err, response) => {
    if(err){
      logger.error("Error while updating emailQueue", {
        input : {campaignId: campaign.id},
        error: err, stack: err.stack});
      return updateFutureEmailsInQueueCB(err);
    }
    return updateFutureEmailsInQueueCB(null);
  });
};


/**
 * To update the future followUps by setting isStopped to false
 * @param  {[campaign]} campaign
 * @param  {[function]} updateFutureFollowUpsCB
 * @return {[type]}
 * @author Aswin Raj A
 */
const updateFutureFollowUps = (campaign, updateFutureFollowUpsCB) => {
  App.followUp.updateAll({campaignId: campaign.id}, {isStopped: false},
    (err, response) => {
    if(err){
      logger.error("Error while updating followUp", {
        input : {campaignId: campaign.id},
        error: err, stack: err.stack});
      return updateFutureFollowUpsCB(err);
    }
    return updateFutureFollowUpsCB(null);
  });
};

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
