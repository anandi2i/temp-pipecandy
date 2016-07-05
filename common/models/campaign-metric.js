"use strict";

import logger from "../../server/log";
import async from "async";

module.exports = function(CampaignMetric) {

  /**
   * Creates an entry on the clicked email model to get the report of
   * From which campaign, who, when, what link clicked
   * @param  {[params]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[function]} addMetricsCB [callback function]
   * @return {[String]} msg [success message]
   * @author Aswin Raj
   */
  CampaignMetric.addMetrics = (reqParams, link, addCampaignMetricsCB) => {
    CampaignMetric.find({
      where :{
        campaignId : reqParams.campaignId
      }
    }, (campaignMetricsErr, campaignMetrics) => {
      if(campaignMetricsErr){
        reqParams.error = campaignMetricsErr;
        logger.error("Error on updating CampaignMetric", campaignMetricsErr);
        return addCampaignMetricsCB(campaignMetricsErr);
      }
        async.each(campaignMetrics, (campaignMetric, campaignMetricsCB) => {
          campaignMetric.updateAttribute("clicked", ++campaignMetric.clicked,
          (campaignMetricUpdateErr, updatedCampaignMetric) => {
            if(campaignMetricUpdateErr){
              reqParams.error = campaignMetricUpdateErr;
              logger.error("Error on updating CampaignMetric",
              campaignMetricUpdateErr);
              return addCampaignMetricsCB(campaignMetricUpdateErr);
            }
            campaignMetricsCB(null);
          });
        }, (err) => {
          if(err){
            return addCampaignMetricsCB(err);
          }
          return addCampaignMetricsCB(null,
             "CampaignMetric added Successfully");
        });
    });
  };

  /**
   * Method to get Metric by Campaign Id
   * @param  {Number}   campaignId [description]
   * @param  {Function} callback   [description]
   * @return {CampaignMetric}              [description]
   * @author Syed Sulaiman M
   */
  CampaignMetric.getMetricByCampaignId = (campaignId, callback) => {
    CampaignMetric.find({
      where: {
        campaignId: campaignId
      }
    }, (metricsErr, metrics) => {
      if(metricsErr) {
        return callback(metricsErr);
      }
      return callback(null, metrics[0]);
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  CampaignMetric.observe("before save", (ctx, next) => {
    if(ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
