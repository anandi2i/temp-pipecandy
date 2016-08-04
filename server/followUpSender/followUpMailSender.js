"use strict";

var async = require("async");
var CronJob = require("cron").CronJob;
var lodash = require("lodash");
var constants = require("../../server/utils/constants");
var statusCodes = require("../../server/utils/status-codes");
require("console-stamp")(console, {pattern : constants.default.TIME_FORMAT});

const appConfig = process.cwd() + "/server/server.js";
const dataSource = require(appConfig).dataSources.psqlDs;
const App = dataSource.models;

let isJobInProgress = false;

/**
 *  Registering Job To Poll Follow Up Table and initiates
 *  Follow Up Sender to sent Follow Up Emails
 */
var job = new CronJob({
  cronTime: "*/2 * * * *", // Cron Expression to Run for every 2 minutes
  onTick: function() {
    if (!isJobInProgress) {
      isJobInProgress = true;
      initFollowUpWorkflow( function (err, result) {
        isJobInProgress = false;
        return;
      });
    }
  },
  start: false
});

job.start();

/**
 * Workflow initiator Send Follow Up Mail
 */
function initFollowUpWorkflow(callback) {
  async.waterfall([
    getFollowUpIds,
    sendFollowUpMail,
    updateFollowUps
  ], function(err, result) {
    if(err) {
        console.error("Error while polling folloUp table", err);
    }
    console.log("Follow Ups Processed");
    return callback(err, result);
  });
};

/**
 * Get Follow Up Ids
 * @param  {Function} callback
 */
function getFollowUpIds(callback) {
  App.followUp.getFolloUpsToSent( function(followUpsErr, followUps) {
    if(lodash.isEmpty(followUps)) {
      console.error("No Follow Ups to Sent");
    }
    return callback(followUpsErr, followUps);
  });
}

/**
 * Method to init Follow Up Mail Assembler
 * @param  {Object}   followUps
 * @param  {Function} callback
 */
function sendFollowUpMail(followUps, callback) {
  async.eachSeries(followUps, function(followUp, followUpCB) {
    App.followUp.assembleEmails(followUp, (emailErr, result) => {
      if(emailErr) {
        console.error("Error while assembleEmails", emailErr);
        return followUpCB(emailErr);
      }
      console.log(result);
      return followUpCB(null);
    });

  }, function done() {
    return callback(null, followUps);
  });
}

/**
 * Update FollowUp to set isFollowUpGenerated flag to true
 *
 * @param  {[FollowUp]}   followUps
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateFollowUps(followUps, callback) {
  async.each(followUps, (followUp, followUpCB) => {
    let properties = {
      isFollowUpGenerated: true,
      statusCode: statusCodes.default.executingFollowUp
    };
    followUp.updateAttributes(properties, (updateErr, updatedInst) => {
      if(updateErr){
        console.error("Error while updating followUp");
      }
      followUpCB(updateErr, updatedInst);
    });
  }, (asyncError) => {
    return callback(asyncError, followUps);
  });
}
