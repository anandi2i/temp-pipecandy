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
    let campaign = JSON.parse(message.Body);
    console.log("Recived Message : ", campaign);
    App.campaign.findById(campaign.id, (campaignErr, campaign) => {
      if(campaignErr || lodash.isEmpty(campaign)) {
        console.error("Error while getting campaign",
          {error: campaignErr, input: campaign});
        done();
        return;
      }
      if(campaign.statusCode !== statusCodes.default.enqueued
        && campaign.statusCode !== statusCodes.default.campaignResumed) {
        console.error("Error while validating status for Id: ", campaign.id);
        done();
        return;
      }
      async.parallel({
        emailQueue: App.emailQueue.assembleEmails.bind(null, campaign),
        followup: App.followUp.prepareScheduledAt.bind(null, campaign.id)
      }, (parallelErr, results) => {
        done();
        if(parallelErr) {
          console.error(parallelErr);
          return;
        }
        console.log("Assembled Emails Successfully campaignId: ", campaign.id);
      });

    });
  },
  sqs: new AWS.SQS()
});

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
