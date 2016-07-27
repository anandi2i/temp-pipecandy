import lodash from "lodash";
import async from "async";

module.exports = function(CampaignAudit) {

  /**
   * Get Audit By Person And Campaign Id
   * @param {Number} personId
   * @param {Number} campaignId
   * @param {Function} callback
   * @author Syed Sulaiman M
   */
  CampaignAudit.getAuditByPersonAndCampaign =
        (personId, campaignId, callback) => {
    CampaignAudit.find({
      where: {
        campaignId: campaignId,
        personId: personId
      }
    }, (campaignAuditsErr, campaignAudits) => {
      return callback(campaignAuditsErr, campaignAudits[0]);
    });
  };

//npm run calls
  /**
   * Checks whether the person is valid to generating followup or not
   *
   * @param  {[type]}  campaign                [description]
   * @param  {[type]}  person                  [description]
   * @param  {[type]}  followup                [description]
   * @param  {Boolean} isEligibleForFollowupCB [description]
   * @return {[type]}                          [description]
   * @author Ramanavel Selvaraju
   */
  CampaignAudit.isEligibleForFollowup = (campaign, person, followup,
     isEligibleForFollowupCB) => {
    CampaignAudit.find({where: {and: [
      {personId: person.id}, {campaignId: campaign.id}, {followUpId: null},
      {isEligibleToFollowUp: true}
      ]}
    }, (auditFindErr, audits) => {
      if(auditFindErr) {
        logger.error({error: auditFindErr, stack: auditFindErr.stack,
          campaign: campaign, person: person, followup: followup});
        return isEligibleForFollowupCB(auditFindErr, false);
      }
      return isEligibleForFollowupCB(null, !lodash.isEmpty(audits));
    });
  };


  /**
   * API to update isEmili
   * @param  {[type]} campaignId [description]
   * @param  {[type]} updateCB   [description]
   * @return {[type]}            [description]
   * @author Aswin Raj A
   */
  CampaignAudit.updateFollowUpEligiblity = (campaignId, personId, updateCB) => {
    CampaignAudit.find({
      where: {
        campaignId: campaignId,
        personId: personId
      }
    }, (auditFindErr, campaignAudits) => {
      if(auditFindErr){
        logger.error("Error while finding campaign audit", {
          input:{campaignId: campaignId, personId: personId},
          error: auditFindErr, stack: auditFindErr.stack
        });
        return updateCB(auditFindErr);
      }
      let updatedCampaignAudits = [];
      async.each(campaignAudits, (campaignAudit, auditEachCB) => {
        campaignAudit.updateAttribute("isEligibleToFollowUp", false,
          (auditUpdateErr, updatedAudit) => {
          if(auditUpdateErr){
            logger.error("Error while finding campaign audit", {
              input:{campaignId: campaignId},
              error: auditUpdateErr,
              stack: auditUpdateErr.stack
            });
            return auditEachCB(auditUpdateErr);
          }
          updatedCampaignAudits.push(updatedAudit);
          return auditEachCB(null);
        });
      }, (err) => {
        if(err){
          logger.error("Error while updating followup eligibility status in\
           campaignAudit");
           return updateCB(err);
        }
        return updateCB(null, updatedCampaignAudits);
      });
    });
  };

//observers
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  CampaignAudit.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
