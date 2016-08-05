"use strict";

import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import logger from "../../server/log";
import lodash from "lodash";

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

  ClickedEmailLink.remoteMethod(
    "countReport", {
      description: "Get Clicked Links with Count",
      accepts: [
        {arg: "campaignId", type: "number"},
        {arg: "res", type: "object", "http": {source: "res"}},
        {arg: "req", type: "object", "http": {source: "req"}}
      ],
      returns: {arg: "object", type: "object", root: true},
      http:
        {path: "/campaign/:campaignId", verb: "GET"}
    }
  );
  /**
   * API to get all Clicked Links of a Campaign
   *
   * @param  {[number]} campaignId
   * @param  trackEmailCB (Callback)
   * @return [Object]
   */
  ClickedEmailLink.countReport = (campaignId, res, req, callback) => {
    ClickedEmailLink.app.models.campaign.getCampaignWithEmailLinks(campaignId,
        (campaignErr, campaign) => {
      if(!campaign) return callback(errorMessages.INVALID_CAMPAIGN_ID);
      let campaignJSON = JSON.parse(JSON.stringify(campaign));

      let emailLinks = campaignJSON.emailLinks;

      let clickedEmailLinkGrpByLink
          = lodash.groupBy(campaignJSON.clickedEmailLinks, "emailLinkId");
      let countReports = [];
      let linkIds = lodash.keys(clickedEmailLinkGrpByLink);

      campaign.campaignMetrics( (campaignMetricErr, campaignMetrics) => {
        let campaignMetric = campaignMetrics[0];
        if(campaignMetricErr) {
          logger.error("Error while finding Campaign Metric", {
            input: {"campaignId": campaign.id}, error: campaignMetricErr,
            stack: campaignMetricErr.stack});
          return callback(errorMessages.SERVER_ERROR);
        }
        let deliveredEmails = campaignMetric.sentEmails -
            (campaignMetric.bounced + campaignMetric.failedEmails);
        lodash(linkIds).forEach((linkId) => {
          let clickCount =
            lodash.uniqBy(clickedEmailLinkGrpByLink[linkId], "personId").length;
          const hundred = 100;
          let clickRate = (clickCount / parseInt(deliveredEmails)) * hundred;
          clickRate = Math.round(clickRate * hundred) / hundred;
          countReports.push({
            link: lodash.find(emailLinks, {"id": parseInt(linkId)}).linkurl,
            clickCount: clickCount,
            clickRate: clickRate
          });
        });
        return callback(null, countReports);
      });
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
