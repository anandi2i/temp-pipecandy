"use strict";

var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");
var queueConfig = require("../../server/utils/queue-config");

const dataSource = require(process.cwd() + "/server/server.js").dataSources
                                                                  .psqlDs;

const App = dataSource.models;

AWS.config.update({
  region: queueConfig.region,
  accessKeyId: queueConfig.accessKeyId,
  secretAccessKey: queueConfig.secretAccessKey
});

const queueName = "mailAssemblerQueue";

/**
 * Consumer process for mail dequeue
 */
const app = Consumer.create({
  queueUrl: queueConfig.queueUrl[queueName],
  handleMessage: function(message, done) {
    let campaign = JSON.parse(message.Body);
    App.emailQueue.assembleEmails(campaign.id, (assembleEmailsErr, messgae) => {
      if(assembleEmailsErr) {
        console.error(assembleEmailsErr);
        return;
      }
      console.log(messgae);
    });
    done();
  },
  sqs: new AWS.SQS()
});

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
