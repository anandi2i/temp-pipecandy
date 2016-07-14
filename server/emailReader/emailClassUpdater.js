"use strict";

var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");

const appConfig = process.cwd() + "/server/server.js";
const dataSource = require(appConfig).dataSources.psqlDs;

const App = dataSource.models;
const queue = require(appConfig).settings.queue;

AWS.config.update({
  region: queue.config.region,
  accessKeyId: queue.config.accessKeyId,
  secretAccessKey: queue.config.secretAccessKey
});

const queueName = "intelligenceOut";

/**
 * Consumer process for mail dequeue
 */
const app = Consumer.create({
  queueUrl: queue.url[queueName],
  handleMessage: function(message, done) {
    let mailData = JSON.parse(message.Body);
    App.MailResponse.updateMailClass(mailData, function (err, result) {
      if(err) {
        console.error("Error while updating Class for mail", mailData.id, err);
      }
    });
    App.inboxMail.findByUserIdAndThreadId(mailData.userId, mailData.threadId,
        function (err, inboxMail) {
      if(err) {
        console.error("Error while getting inboxMail for userId and threadId",
          mailData.userId, mailData.threadId, err);
      } else {
        if(inboxMail) {
          App.inboxMail.updateClass(inboxMail, mailData.NLPClass,
              function (err, inboxMail) {
            if(err) {
              console.error("Error updating inboxMail for userId and threadId",
                mailData.userId, mailData.threadId, err);
            }
          });
        }
      }
    });
    done();
  },
  sqs: new AWS.SQS()
});

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
