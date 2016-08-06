"use strict";

import async from "async";
import lodash from "lodash";
import logger from "../../server/log";

module.exports = function(FollowUpMetric) {

//npm run calls
  /**
   * gets Followup metric and incremntes the assembled count
   *
   * @param  {FollowUp}   followup
   * @param  {String} property [metric property like sent, assembled, bounced]
   * @param  {Function} cb       [callback]
   * @author Ramanavel Selvaraju
   */
  FollowUpMetric.getAndIncrementByProperty =
    (followUp, property, cb) => {
    getFollowUpMetrics(followUp, (findErr, followUp, metric) => {
      if(findErr) return cb(findErr);
      FollowUpMetric.app.models.campaignMetric.incrementMetric(
        metric, property, (incrementErr) => {
        return cb(incrementErr);
      });
    });
  };

  /**
   * returns followUp metrics for a followUp Object
   *
   * @param  {followUp} followUp
   * @param  {function} getCampaignMetricsCB [callback]
   * @author Ramanavel Selvaraju
   */
  const getFollowUpMetrics = (followUp, getFollowUpMetricsCB) => {
    FollowUpMetric.find({where: {followUpId: followUp.id}
    }, (findErr, followUpMetrics) => {
      if(findErr) {
        logger.error({error: findErr, stack: findErr.stack,
                      input: {followUp: followUp}});
        return getFollowUpMetricsCB(findErr);
      }
      return getFollowUpMetricsCB(null, followUp,
                  lodash.isEmpty(followUpMetrics) ? null : followUpMetrics[0]);
    });
  };


  /**
   * updaets the followup metrics campagin metrics not found it will create
   * new one
   *
   * @param  {[campaign]} campaign
   * @param  {[function]} updateMertricsOnGenCB
   * @author Aswin Raj A
   */
  FollowUpMetric.updateMertricsOnGen = (followUp, updateMertricsOnGenCB) => {
    async.waterfall([
      async.apply(getFollowUpMetrics, followUp),
      createFollowUpMetrics,
      updateAssemblerMetrics
    ], (waterfallErr) => {
      return updateMertricsOnGenCB(waterfallErr);
    });
  };


  /**
   * if metrics object null creates metrics object
   * @param  {[followUp]} followUp
   * @param  {[metric]} FollowUpMetric
   * @param  {[function]} createFollowUpMetricsCB [callback]
   * @author Aswin Raj A
   */
  const createFollowUpMetrics = (followUp, metric, createFollowUpMetricsCB) => {
    if(metric) {
      return createFollowUpMetricsCB(null, followUp, metric);
    }
    followUp.campaign((err, campaign) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
          input: {followUp: followUp}});
        return createFollowUpMetricsCB(err);
      }
      FollowUpMetric.create({followUpId: followUp.id, campaignId: campaign.id},
          (err, metrics) => {
        if(err) {
          logger.error({error: err, stack: err.stack,
            input: {followUp: followUp}});
          return createFollowUpMetricsCB(err);
        }
        return createFollowUpMetricsCB(null, followUp, metrics);
      });
    });
  };

  /**
   * Creates an entry on the clicked email model to get the report of
   * From which followUp, who, when, what link clicked
   * @param  {[params]} reqParams [{emailLinkId, personId, campaignId, followUpId}]
   * @param  {[function]} addMetricsCB [callback function]
   * @return {[String]} msg [success message]
   * @author Rahul Khandelwal
   */

  FollowUpMetric.addMetrics = (reqParams, link, addFollowUpMetricsCB) => {
    FollowUpMetric.find({
      where :{
        followUpId : reqParams.followUpId
      }
    }, (followUpMetricsErr, followUpMetrics) => {
      if(followUpMetricsErr){
        reqParams.error = followUpMetricsErr;
        logger.error("Error on updating FollowUpMetric", followUpMetricsErr);
        return addFollowUpMetricsCB(followUpMetricErr);
      }
        async.each(followUpMetrics, (followUpMetric, followUpMetricsCB) => {
          followUpMetric.updateAttribute("clicked", ++followUpMetric.clicked,
          (followUpMetricUpdateErr, updatedFollowUpMetric) => {
            if(followUpMetricUpdateErr){
              reqParams.error = followUpMetricUpdateErr;
              logger.error("Error on updating FollowUpMetric",
              followUpMetricUpdateErr);
              return addFollowUpMetricsCB(followUpMetricUpdateErr);
            }
            followUpMetricsCB(null);
          });
        }, (err) => {
          if(err){
            return addFollowUpMetricsCB(err);
          }
          return addFollowUpMetricsCB(null,
             "FollowUpMetric added Successfully");
        });
    });
  };

  /**
   * updates the already sent mails as assembeled emails count
   * because already sent means already assembed from assember so that metrics
   * also should caputured here
   *
   * @param  {[followUp]} followUp
   * @param  {[followUpMetric]} metric
   * @param  {[function]} updateAssemblerMetricsCB [callback]
   * @author Aswin Raj A
   */
  const updateAssemblerMetrics = (followUp, metrics, updateAssemMetricsCB) => {
    metrics.assembled = metrics.sentEmails;
    metrics.errorInAssmebler = 0;
    metrics.updateAttributes(metrics, (err, updatedMetrics) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
          input: {followUp: followUp}});
        return updateAssemMetricsCB(err);
      }
      return updateAssemMetricsCB(null);
    });
  };

//observe
/**
 * Updates the updatedAt column with current Time
 * @param ctx Context
 * @param next (Callback)
 */
FollowUpMetric.observe("before save", (ctx, next) => {
  if (ctx.instance) {
    ctx.instance.updatedAt = new Date();
  } else {
    ctx.data.updatedAt = new Date();
  }
  next();
});
};
