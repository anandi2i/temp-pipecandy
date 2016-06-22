var config = require("../../server/config.json");

/**
 * Queue Configuration File
 * @author Syed Sulaiman M
 */
const accessKeyId = config.queue.config.accessKeyId;
const secretAccessKey = config.queue.config.secretAccessKey;
const region = config.queue.config.region;

const queueUrl = {
  mailNLPIdentification: config.queue.url.intelligenceIn,
  mailNLPDetermined: config.queue.url.intelligenceOut,
  mailAssemblerQueue: config.queue.url.emailAssembler
};

module.exports = {
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  queueUrl: queueUrl
};
