/**
 * List of public email providers
 */
const accessKeyId = "AKIAJ53GEQAAN6LWLTUQ";
const secretAccessKey = "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";
const region = "ap-southeast-1";

const queueUrl = {
  mailNLPIdentification: "https://sqs.ap-southeast-1.amazonaws.com/736447789897/pc-dev-intelligence-in",
  mailNLPDetermined: "https://sqs.ap-southeast-1.amazonaws.com/736447789897/pc-dev-intelligence-out",
  mailAssemblerQueue: "https://sqs.ap-southeast-1.amazonaws.com/736447789897/pc-dev-email-assembler"
};

module.exports = {
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  queueUrl: queueUrl
};
