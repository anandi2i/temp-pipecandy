var Consumer = require("sqs-consumer");
var AWS = require("aws-sdk");

var dataSource = require(process.cwd() + "/server/server.js").dataSources
                                                                  .psqlDs;

var App = dataSource.models;


AWS.config.update({
  region: "ap-southeast-1",
  accessKeyId: "AKIAJ53GEQAAN6LWLTUQ",
  secretAccessKey: "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"
});

/**
 * Creating a Consumer process
 */
var app = Consumer.create({
  queueUrl: "https://sqs.ap-southeast-1.amazonaws.com/736447789897/pc-dev-email-assembler",
  handleMessage: function(message, done) {

    var campaignId = parseInt(message.Body);

    App.emailQueue.assembleEmails(campaignId, (assembleEmailsErr, messgae) => {
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
  logger.mailAssemblerError(err.message);
});

app.start();
