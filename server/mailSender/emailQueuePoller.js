'use strict';

var CronJob = require('cron').CronJob;
var campaignMailSender = require("../../server/mailSender/campaignMailSender");

let isJobInProgress = false;

var job = new CronJob({
  cronTime: '* */2 * * * *',
  onTick: function() {
    if (!isJobInProgress) {
      isJobInProgress = true;
      console.log("Cron is executing--", new Date().getTime());
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
