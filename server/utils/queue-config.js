var app = require("../../server/server.js");

/**
 * Queue Configuration File
 * @author Syed Sulaiman M
 */
const accessKeyId = app.get("queue").config.accessKeyId;
const secretAccessKey = app.get("queue").config.secretAccessKey;
const region = app.get("queue").config.region;

const queueUrl = {
  mailNLPIdentification: app.get("queue").url.intelligenceIn,
  mailNLPDetermined: app.get("queue").url.intelligenceOut,
  mailAssemblerQueue: app.get("queue").url.emailAssembler
};

module.exports = {
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  queueUrl: queueUrl
};
