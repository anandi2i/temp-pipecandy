"use strict";

var AWS = require("aws-sdk");
var constants = require("../../server/utils/constants");
require("console-stamp")(console, 
  {pattern : constants.default.TIME_FORMAT});

const appConfig = process.cwd() + "/server/server.js";
const queue = require(appConfig).settings.queue;

AWS.config.update({
  accessKeyId: queue.config.accessKeyId,
  secretAccessKey: queue.config.secretAccessKey
});

const sqs = new AWS.SQS({
  region: queue.config.region
});

/**
 * Producer to insert messages to queue
 * @param  {Object}   mailContent data to insert in queue
 * @param  {Function} callback    callback method
 */
const enqueueMail = (data, queueName, callback) => {
  let sqsParams = {
    QueueUrl: queue.url[queueName],
    MessageBody: data
  };
  sqs.sendMessage(sqsParams, (err, data) => {
    if (err) {
      console.error("Error while pushing to the AWS Queue", err);
    }
    callback(err, data);
  });
};

module.exports = {
  enqueueMail: enqueueMail
};
