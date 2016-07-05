"use strict";

var async = require("async");
var CronJob = require("cron").CronJob;
var lodash = require("lodash");

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
    sendFollowUpMail
  ], function(err, result) {
    if(err) {
        console.error("Error while polling folloUp table", err);
    }
    console.log("Follow Ups Processed");
    callback(err, result);
  });
};

/**
 * Get Follow Up Ids
 * @param  {Function} callback
 */
function getFollowUpIds(callback) {
  App.followUp.getFolloUpsToSent( function(followUpsErr, followUps) {
    if(lodash.isEmpty(followUps)) {
      console.log("No Follow Ups to Sent");
    }
    async.each(followUps, (followUp, followUpCB) => {
      followUp.updateAttribute("isFollowUpGenerated", true,
          (updateErr, updatedInst) => {
            followUpCB(updateErr, updatedInst);
      });
    }, (asyncError) => {
      callback(asyncError, followUps);
    });
  });
}

/**
 * Method to init Follow Up Mail Assembler
 * @param  {Object}   followUps
 * @param  {Function} callback
 */
function sendFollowUpMail(followUps, callback) {
  async.eachSeries(followUps, function(followUp, followUpCB) {
    // TODO: Call Assembler to send Follow Up Mail
    followUpCB(null);
  }, function done() {
    callback(null, followUps);
  });
}
