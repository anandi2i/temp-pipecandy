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

const queueName = "mailNLPDetermined";

/**
 * Consumer process for mail dequeue
 */
const app = Consumer.create({
  queueUrl: queueConfig.queueUrl[queueName],
  handleMessage: function(message, done) {
    let mailData = JSON.parse(message.Body);
    App.MailResponse.updateMailClass(mailData, function (err, result) {
      if(err) {
        console.error("Eror while update NLP Class for mail");
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
