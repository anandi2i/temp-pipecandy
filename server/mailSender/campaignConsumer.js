var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");

var dataSource = require(process.cwd() + "/server/server.js").dataSources
                                                                  .psqlDs;

var App = dataSource.models;


AWS.config.update({
  region: "ap-southeast-1s",
  accessKeyId: "AKIAJUDP7FRPRTLTANWA",
  secretAccessKey: "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"
});

/**
 * Creating a Consumer process
 */
var app = Consumer.create({
  queueUrl: "https://sqs.ap-southeast-1.amazonaws.com/744997405498/mailSenderQueue",
  handleMessage: function(message, done) {

    var campaignId = parseInt(message.Body);

    App.emailQueue.assembleEmails(campaignId);

  },
  sqs: new AWS.SQS()
});

app.on("error", function(err) {
  console.log(err.message);
});

app.start();
