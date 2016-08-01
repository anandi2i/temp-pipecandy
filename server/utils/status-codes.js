const statusCodes = {
  "new" : 0,
  "updated" : 8,
  "enqueued": 9,
  "processing" : 10,
  "metricsAdded" : 49,
  "readyToSend" : 50,
  "executingCampaign" : 60, // Status represents Sending Emails of Campaign is Inprogress
  "campaignStopped" : 62, // Status represents Emails of Campaign is Stopped
  "campaignResumed" : 63,
  "campaignSent" : 65, // Status represents All Emails of Campaign is Sent
  "followUpStopped-1": 70,
  "followUpResumed-1": 71,
  "followUpStopped-2": 72,
  "followUpResumed-2": 73,
  "followUpStopped-3": 74,
  "followUpResumed-3": 75,
  "followUpStopped-4": 76,
  "followUpResumed-4": 77,
  "followUpStopped-5": 78,
  "followUpResumed-5": 79,
  "followUpStopped-6": 80,
  "followUpResumed-6": 81,
  "followUpStopped-7": 82,
  "followUpResumed-7": 83,
  "followUpStopped-8": 84,
  "followUpResumed-8": 85,
  "followUpStopped" : 90, // Status represents FollowUp Emails of Campaign is Stopped
  "followUpResumed" : 91, // Status represents FollowUp Emails of Campaign is Stopped
  "followUpProcessing" : 92,
  "followUpMetricsAdded" : 93,
  "followUpReadyToSend" : 94,
  "executingFollowUp" : 95, // Status represents Sending FollowUp Emails of Campaign is Inprogress
  "followUpSent" : 96, // Status represents All FollowUp Emails of Campaign is Sent
  "campaignExecuted" : 100
};


//export default statusCodes;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = statusCodes;
