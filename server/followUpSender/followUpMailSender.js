var async = require("async");

const dataSource = require(process.cwd() + "/server/server.js").dataSources
  .psqlDs;
const App = dataSource.models;
const interval = 10000;

initFollowUp();

/**
 * Initiate Workflow for every interval
 */
function initFollowUp() {
  setTimeout(initFollowUpWorkflow, interval);
}

/**
 * Workflow initiator Send Follow Up Mail
 */
function initFollowUpWorkflow() {
  async.waterfall([
    getFollowUpIds,
    sendFollowUpMail
  ], function(waterFallErr, result) {
    if(waterFallErr) {
        console.error("Error while polling folloUp table", waterFallErr);
    }
    initFollowUp();
  });
};

/**
 * Get Follow Up Ids
 * @param  {Function} callback
 */
function getFollowUpIds(callback) {
  App.followUp.find({
    where: {
      isFollowUpGenerated: false
    },
    limit: 100
  }, function(followUpsErr, followUps) {
    async.each(followUps, (followUp, followUpCB) => {
      followUp.updateAttribute("isFollowUpGenerated", true,
          (updateErr, updatedInst) => {
            followUpCB(updateErr, updatedInst);
      });
    }, (asyncError) => {
      callback(asyncError, followUps);
    });
  });
}

/**
 * Method to init Follow Up Mail Assembler
 * @param  {Object}   followUps
 * @param  {Function} callback
 */
function sendFollowUpMail(followUps, callback) {
  async.eachSeries(followUps, function(followUp, followUpCB) {
    // TODO: Call Assembler to send Follow Up Mail
    followUpCB(null);
  }, function done() {
    callback(null, followUps);
  });
}
