module.exports = function(EmailLink) {

  EmailLink.getOrSave = (campaign, link, getOrSaveCB) => {
    EmailLink.find({where: {and: [{campaignId: campaign.id},
      {linkurl: link}]}}, (emailLinkExistsFindErr, emailLinks)=>{
      if(emailLinkExistsFindErr) {
        logger.error("Check link Exists in emailLinks Find Error", {
          error: emailLinkExistsFindErr,
          campaign: campaign,
          link: link
        });
        return getOrSaveCB(emailLinkExistsFindErr);
      }
      if(lodash.isEmpty(emailLinks)) {
        EmailLink.create({linkurl: link, clickedCount: 0,
           campaignId: campaign.id
        }, (emailLinkEntryDataErr, emailLink) => {
            if(emailLinkEntryDataErr) {
              logger.error("Check link Exists in emailLinks Find Error", {
                error: emailLinkEntryDataErr,
                campaign: campaign,
                link: link
              });
              return getOrSaveCB(emailLinkExistsFindErr);
            }
            return getOrSaveCB(null, emailLink);
        });
      }

      return getOrSaveCB(null, emailLinks[0]);

    }); //EmailQueue.find
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  EmailLink.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
