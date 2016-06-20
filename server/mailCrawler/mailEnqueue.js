import AWS from "aws-sdk";
import logger from "../../server/log";
import queueConfig from "../../server/utils/queue-config";

AWS.config.update({
  accessKeyId: queueConfig.accessKeyId,
  secretAccessKey: queueConfig.secretAccessKey
});

const sqs = new AWS.SQS({
  region: queueConfig.region
});

/**
 * Producer to insert messages to queue
 * @param  {Object}   mailContent data to insert in queue
 * @param  {Function} callback    callback method
 */
const enqueueMail = (data, queueName, callback) => {
  let sqsParams = {
    QueueUrl: queueConfig.queueUrl[queueName],
    MessageBody: data
  };
  sqs.sendMessage(sqsParams, (err, data) => {
    if (err) {
      logger.error("Error while pushing to the AWS Queue", err);
    }
    callback();
  });
};

module.exports = {
  enqueueMail: enqueueMail
};
