"use strict";

var CronJob = require("cron").CronJob;
var campaignMailSender = require("../../server/mailSender/campaignMailSender");

let isJobInProgress = false;

/**
 *  Registering Job To Poll Email Queue Table and initiates
 *  Mail Sender to sent Emails
 */
var job = new CronJob({
  cronTime: "* * * * *", // Cron Expression to Run for every 1 minutes
  onTick: function() {
    if (!isJobInProgress) {
      isJobInProgress = true;
      campaignMailSender.getEmailQueue( function (queuedMailsErr, queuedMails) {
        if (queuedMailsErr) {
          console.log("Error while getting queued Mails", queuedMailsErr);
          isJobInProgress = false;
          return;
        }
        let zero = 0;
        if (queuedMails.length === zero) {
          console.log("No Mails Queued");
          isJobInProgress = false;
          return;
        }
        campaignMailSender.generateAndSendEmail(queuedMails,
            function (error, result) {
          isJobInProgress = false;
          return;
        });
      });
    }
  },
  start: false
});

job.start();
