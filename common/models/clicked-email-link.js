"use strict";

import logger from "../../server/log";

module.exports = function(ClickedEmailLink) {

  /**
   * Creates an entry on the clicked email model to get the report of
   * From which campaign, who, when, what link clicked
   *
   * @param  {[params]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[function]} clickedEmailMetricsCB [callback function]
   * @return {[String]} msg [success message]
   * @author Ramanavel Selvaraju
   */
  ClickedEmailLink.addMetrics = (reqParams, clickedEmailMetricsCB) => {
    ClickedEmailLink.create(reqParams, (ClickedLinkCreateErr, clickedLink) => {
      if(ClickedLinkCreateErr) {
        reqParams.error = ClickedLinkCreateErr;
        logger.error("Error on Creating ClickedEmailLink", reqParams);
        return clickedEmailMetricsCB(ClickedLinkCreateErr);
      }
      return clickedEmailMetricsCB(null, "Created Successfully");
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  ClickedEmailLink.observe("before save", (ctx, next) => {
    if(ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else{
      ctx.data.updatedAt = new Date();
    }
    next();
  });

};
