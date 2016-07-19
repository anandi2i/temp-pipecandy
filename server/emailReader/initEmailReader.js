"use strict";

var CronJob = require("cron").CronJob;
var emailReader = require("../../server/emailReader/emailReader");

let isJobInProgress = false;

/**
 *  Registering Job To Get Users and Read their Inbox
 */
var job = new CronJob({
  cronTime: "*/10 * * * * *", // Cron Expression to Run for every 1 minutes
  onTick: function() {
    if (!isJobInProgress) {
      isJobInProgress = true;
      emailReader.cargo.push({}, function(err) {
          isJobInProgress = false;
          return;
      });
    }
  },
  start: false
});

job.start();
