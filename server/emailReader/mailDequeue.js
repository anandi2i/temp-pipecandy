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

const neutralNLPClasses = ["Interested", "Interested, schedule meeting",
  "mail chain", "need details", "random"];

/**
 * Consumer process for mail dequeue
 */
const app = Consumer.create({
  queueUrl: queue.url[queueName],
  handleMessage: function(message, done) {
    let mailData = JSON.parse(message.Body);
    App.MailResponse.updateMailClass(mailData, function (err, result) {
      if(err) {
        console.error("Eror while update NLP Class for mail");
      }
    });
    if(neutralNLPClasses.includes(mailData.NLPClass)) {
      App.inboxMail.findByUserIdAndThreadId(mailData.userId, mailData.threadId,
          function (err, inboxMail) {
        if(err) {
          console.error("Eror while getting inboxMail for userId and threadId",
            mailData.userId, mailData.threadId, err);
        } else {
          if(inboxMail) {
            App.inboxMail.updateActionable(inboxMail, true,
                function (err, inboxMail) {
              if(err) {
                console.error("Eror updating inboxMail for userId and threadId",
                  mailData.userId, mailData.threadId, err);
              }
            });
          }
        }
      });
    }
    done();
  },
  sqs: new AWS.SQS()
});

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
