var AWS = require("aws-sdk");
import logger from "../../server/log";

AWS.config.update({
  accessKeyId: "AKIAJUDP7FRPRTLTANWA",
  secretAccessKey: "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"
});

var sqs = new AWS.SQS({
  region: "ap-southeast-1"
});

var campaignID = 1;

var sqsParams = {
  MessageBody: campaignID.toString(),
  QueueUrl: "https://sqs.ap-southeast-1.amazonaws.com/744997405498/mailSenderQueue"
};

sqs.sendMessage(sqsParams, function(err, data) {
  if (err) {
    logger.mailAssemblerError("Error while pushing to the AWS Queue");
  }
  logger.mailAssemblerInfo(data);
});
