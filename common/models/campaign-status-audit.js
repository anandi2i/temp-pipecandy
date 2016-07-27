import logger from "../../server/log";


module.exports = function(CampaignStatusAudit) {

  CampaignStatusAudit.createAudit = (campaign, statusCode, createAuditCB) => {
    if(!campaign || !statusCode) {
      logger.error("Invalid inputs", {input : {campaign: campaign.id,
        statusCode: statusCode}});
      createAuditCB("Invalid input");
    }
    const auditObj = {
      campaignId: campaign.id,
      perviousStatus : campaign.statusCode,
      currentStatus: statusCode,
      updatedBy: "User"
    };
    CampaignStatusAudit.create(auditObj, (auditCreateErr, createdAudit) => {
      if(auditCreateErr){
        logger.error("Error while creating campaign status audit", {
          input: {campaignId: campaign.id}, err: auditCreateErr,
          stack: auditCreateErr.stack});
        createAuditCB(auditCreateErr);
      }
      createAuditCB(null, createdAudit);
    });
  };

  //observers
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  CampaignStatusAudit.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
