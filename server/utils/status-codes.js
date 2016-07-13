const statusCodes = {
  "new" : 0,
  "updated" : 8,
  "enqueued": 9,
  "processing" : 10,
  "metricsAdded" : 49,
  "readyToSend" : 50,
  "executingCampaign" : 60,
  "campaignStopped" : 62,
  "campaignExecuted" : 65
};


//export default statusCodes;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = statusCodes;
