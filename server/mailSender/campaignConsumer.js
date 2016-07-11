"use strict";

var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");
var async = require("async");

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
    async.parallel({
      emailQueue: App.emailQueue.assembleEmails.bind(null, campaign.id),
      followup: App.followUp.prepareScheduledAt.bind(null, campaign.id)
    }, (parallelErr, results) => {
      done();
      if(parallelErr) {
        console.error(parallelErr);
        return;
      }
      console.log("Assembled Emails Successfully campaignId: ", campaign.id);
    });
  },
  sqs: new AWS.SQS()
});

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
