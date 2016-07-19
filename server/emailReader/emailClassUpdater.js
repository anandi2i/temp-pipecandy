"use strict";

var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");
var async = require("async");

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
    async.parallel([
      async.apply(updateMailResponseClass, mailData),
      async.apply(updateRelatedTables, mailData),
    ], (err, results) => {
      console.log("Inside Done");
      done();
    });
  },
  sqs: new AWS.SQS()
});

/**
 * Update NLP Class for MailResponse
 * @param  {MailResponse}   mailData
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateMailResponseClass(mailData, callback) {
  App.MailResponse.updateMailClass(mailData, function (err, result) {
    if(err) {
      console.error("Error while updating Class for mail", mailData.id, err);
    }
    return callback(null);
  });
}

/**
 * Update Related Tables for Metric Update Response Count Update
 * @param  {MailResponse}   mailData
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateRelatedTables(mailData, callback) {
  App.inboxMail.findByUserIdAndThreadId(mailData.userId, mailData.threadId,
      function (err, inboxMail) {
    if(err) {
      console.error("Error while getting inboxMail for userId and threadId",
        mailData.userId, mailData.threadId, err);
      return callback(null);
    }
    if(inboxMail) {
      async.parallel([
        async.apply(updateInboxMailClass, inboxMail, mailData),
        async.apply(updateMetricForClassification,
          inboxMail, inboxMail.class, mailData)
      ], (err, results) => {
        return callback(null);
      });
    } else {
      return callback(null);
    }
  });
}

/**
 * Update NLP Class for InboxMail
 * @param  {InboxMail}   inboxMail
 * @param  {MailResponse}   mailData
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateInboxMailClass(inboxMail, mailData, callback) {
  App.inboxMail.updateClass(inboxMail, mailData.NLPClass,
      function (err, inboxMail) {
    if(err) {
      console.error("Error updating inboxMail for userId and threadId",
        mailData.userId, mailData.threadId, err);
    }
    callback(null);
  });
}

/**
 * Update Related Metric Classification Count
 * @param  {InboxMail}   inboxMail
 * @param  {[type]}   mailData
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateMetricForClassification(inboxMail, oldClass, mailData,
    callback) {
  App.inboxMail.updateMetricForClassification(inboxMail,
      mailData.NLPClass, oldClass, function (err, inboxMail) {
    if(err) {
      console.error("Error updating metric for classification for userId and"
        + " threadId", mailData.userId, mailData.threadId, err);
    }
    callback(null);
  });
}

app.on("error", function(err) {
  console.error(err.message);
});

app.start();
