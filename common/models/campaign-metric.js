"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";

module.exports = function(CampaignMetric) {

//npm run calls
  /**
   * creates metric entry for campagin and lists in parallel manner
   *
   * @param  {[Campaign]} campaign
   * @param  {[function]} createMetricsOnGenCB [callback]
   * @author Ramanavel Selvaraju
   */
  CampaignMetric.createMetricsOnGen = (campaign, createMetricsOnGenCB) => {
    async.parallel([
      async.apply(CampaignMetric.updateMertricsOnGen, campaign),
      async.apply(CampaignMetric.app.models.listMetric.updateListMetricOnGen,
                    campaign),
      // async.apply(CampaignMetric.app.models.followUpMetric.updateMertricsOnGen)
    ], (parallelErr) => {
      return createMetricsOnGenCB(parallelErr);
    });
  };

  /**
   * updaets the campaign metrics campagin metrics not found it will create
   * new one
   *
   * @param  {[type]} campaign              [description]
   * @param  {[type]} updateMertricsOnGenCB [description]
   * @return {[type]}                       [description]
   * @author Ramanavel Selvaraju
   */
  CampaignMetric.updateMertricsOnGen = (campaign, updateMertricsOnGenCB) => {
    async.waterfall([
      async.apply(getCampaignMetrics, campaign),
      createCampaignMetrics,
      updateAssemblerMetrics
    ], (waterfallErr) => {
      return updateMertricsOnGenCB(waterfallErr);
    });
  };

  /**
   * returns campagin metrics for a campaign Object
   *
   * @param  {[type]} campaign             [description]
   * @param  {[type]} getCampaignMetricsCB [description]
   * @return {[type]}                      [description]
   * @author Ramanavel Selvaraju
   */
  const getCampaignMetrics = (campaign, getCampaignMetricsCB) => {
    CampaignMetric.find({where: {campaignId: campaign.id}
    }, (findErr, campaignMetrics) => {
      if(findErr) {
        logger.error({error: findErr, stack: findErr.stack,
                      input: {campaign: campaign}});
        return getCampaignMetricsCB(findErr);
      }
      return getCampaignMetricsCB(null, campaign,
                  lodash.isEmpty(campaignMetrics) ? null : campaignMetrics[0]);
    });
  };

  /**
   * if metrics object null creates metrics object
   *
   * @param  {[campaign]} campaign
   * @param  {[CampaignMetric]} metric
   * @param  {[function]} createCampaignMetricsCB [callback]
   * @author Ramanavel Selvaraju
   */
  const createCampaignMetrics = (campaign, metric, createCampaignMetricsCB) => {
    if(metric) {
      return createCampaignMetricsCB(null, campaign, metric);
    }
    CampaignMetric.create({campaignId: campaign.id}, (err, metrics) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
                      input: {campaign: campaign}});
        return createCampaignMetricsCB(err);
      }
      return createCampaignMetricsCB(null, campaign, metrics);
    });
  };

  /**
   * updates the already sent mails as assembeled emails count
   * because already sent means already assembed from assember so that metrics
   * also should caputured here
   *
   * @param  {[campaign]} campaign
   * @param  {[CampaignMetric]} metric
   * @param  {[function]} updateAssemblerMetricsCB [callback]
   * @author Ramanavel Selvaraju
   */
  const updateAssemblerMetrics = (campaign, metrics, updateAssemMetricsCB) => {
    metrics.assembled = metrics.sentEmails;
    metrics.errorInAssmebler = 0;
    metrics.updateAttributes(metrics, (err, updatedMetrics) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
                      input: {campaign: campaign}});
        return updateAssemMetricsCB(err);
      }
      return updateAssemMetricsCB(null);
    });
  };

  /**
   * gets campagin metric and incremntes the assembled count
   *
   * @param  {Campaign}   campaign
   * @param  {String} property [metric property like sent, assembled, bounced]
   * @param  {Function} cb       [callback]
   * @author Ramanavel Selvaraju
   */
  CampaignMetric.getAndIncrementByProperty =
    (campaign, property, cb) => {
    getCampaignMetrics(campaign, (findErr, campaign, metric) => {
      if(findErr) return cb(findErr);
      CampaignMetric.incrementMetric(metric, property, (incrementErr) => {
        return cb(incrementErr);
      });
    });
  };

  /**
   * increments with one whatever the property you have given in the params
   *
   * @param  {[campaignMetric/ListMetric]} metric
   * @param  {[String]} property [metric property like sent, assembled, bounced]
   * @param  {[callaback]} incrementMetricCB [callabck]
   * @author Ramanavel Selvaraju
   */
  CampaignMetric.incrementMetric = (metric, property, incrementMetricCB) => {
    const one = 1;
    metric.updateAttribute(property, metric[property] + one,
      (err, updatedMetrics) => {
        if(err) {
          logger.error({error: err, stack: err.stack,
                        input: {metric: metric, property: property}});
          return incrementMetricCB(err);
        }
        return incrementMetricCB(null);
    });
  };

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
   * Update Properties of a CampaignMetric
   *
   * @param  {CampaignMetric}   campaignMetric
   * @param  {Object}   properties
   * @param  {Function} callback
   * @return {CampaignMetric} Updated Instance
   * @author Syed Sulaiman M
   */
  CampaignMetric.updateProperties = (campaignMetric, properties, callback) => {
    campaignMetric.updateAttributes(properties, (metricErr, metric) => {
      return callback(metricErr, metric);
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
