"use strict";

import logger from "../../server/log";
import lodash from "lodash";
import async from "async";
import _ from "underscore";

module.exports = function(ListMetric) {

  /**
   * find the related list for the person and the campaign
   * and increments the metrics
   * @param  {[type]}   campagin
   * @param  {[type]}   person
   * @param  {[type]}   property
   * @param  {Function} callback
   * @author Ramanavel Selvaraju
   */
  ListMetric.getAndIncrementByProperty = (campagin, person, property,
    callback) => {
    getListMetricsByCampaignAndPerson(campagin, person,
      (getMetricsErr, metrics) => {
        if(getMetricsErr) return callback(getMetricsErr);
        async.each(metrics, (metric, cb) => {
          ListMetric.app.models.campaignMetric.incrementMetric(metric, property,
            (incrementErr) => {
            return cb(incrementErr);
          });
        }, (err) => {
          return callback(err);
        });
    });
  };

  /**
   * gets lists and then list metrics using campagin and person objects
   *
   * @param  {Campagin}   campagin
   * @param  {Person}   person
   * @param  {Function} callback
   * @author Ramanavel Selvaraju
   */
  const getListMetricsByCampaignAndPerson = (campaign, person, callback) => {
    async.waterfall([
      async.apply(ListMetric.app.models.campaign.getCampaignListForPerson,
      campaign.id, person.id),
      getListMetricsForLists,
    ], (waterfallErr, metrics) => {
      if(waterfallErr) {
        return callback(waterfallErr);
      }
      return callback(null, metrics);
    });
  };

  /**
   * get list metrics for given array of list object
   *
   * @param  {[List]}   lists
   * @param  {Function} callback
   * @author Ramanavel Selvaraju
   */
  const getListMetricsForLists = (lists, campaignId, personId, callback) => {
    if(lodash.isEmpty(lists)) return callback(null, lists);
    const listIds = _.pluck(lists, "id");
    ListMetric.find({where: {and:
      [{listId: {inq: listIds}, campaignId: campaignId}]}
    }, (metricFindErr, metrics) => {
      if(metricFindErr) {
        logger.error("Error while finding the metrics for lists : ",
                  {error: metricFindErr, stack: metricFindErr.stack,
                      input: {listIds: listIds}});
        return callback(metricFindErr);
      }
      return callback(null, metrics);
    });
  };

  /**
   * gets lists using campaign object itterates and updates the assemblermetrics
   * @param  {[type]} campaign                [description]
   * @param  {[type]} updateListMetricOnGenCB [description]
   * @return {[type]}                         [description]
   * @author Ramanavel Selvaraju
   */
  ListMetric.updateListMetricOnGen = (campaign, updateListMetricOnGenCB) => {
    campaign.lists((listErr, lists) => {
      async.each(lists, (list, cb) => {
        async.waterfall([
          async.apply(getListMetrics, campaign, list),
          createListMetrics,
          updateAssemblerMetrics
        ], (waterfallErr) => {
          if(waterfallErr) {
            return cb(waterfallErr);
          }
          return cb(null);
        });
      }, (asyncEachListErr) => {
        return updateListMetricOnGenCB(asyncEachListErr);
      });
    });
  };

  /**
   * returns list metrics for a campaign and list Objects
   *
   * @param  {[type]} campaign
   * @param  {[List]} list
   * @param {[Function]} getListMetricsCB
   * @author Ramanavel Selvaraju
   */
  const getListMetrics = (campaign, list, getListMetricsCB) => {
    ListMetric.find({where: {and:
      [{campaignId: campaign.id}, {listId: list.id}]}
    }, (findErr, listMetrics) => {
      if(findErr) {
        logger.error({error: findErr, stack: findErr.stack,
                      input: {campaign: campaign, list: list}});
        return getListMetricsCB(findErr);
      }
      return getListMetricsCB(null, campaign, list,
                  lodash.isEmpty(listMetrics) ? null : listMetrics[0]);
    });
  };

  /**
   * if metrics object null creates metrics object
   *
   * @param  {[campaign]} campaign
   * @param  {[List]} list
   * @param  {[CampaignMetric]} metric
   * @param  {[function]} createListMetricsCB [callback]
   * @author Ramanavel Selvaraju
   */
  const createListMetrics = (campaign, list, metric, createListMetricsCB) => {
    if(metric) {
      return createListMetricsCB(null, metric);
    }
    ListMetric.create({campaignId: campaign.id, listId: list.id},
      (err, metrics) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
                      input: {campaign: campaign, list: list}});
        return createListMetricsCB(err);
      }
      return createListMetricsCB(null, metrics);
    });
  };

  /**
   * updates the already sent mails as assembeled emails count
   * because already sent means already assembed from assember so that metrics
   * also should caputured here
   *
   * @param  {[campaign]} campaign
   * @param  {[ListMetric]} metric
   * @param  {[function]} updateAssemblerMetricsCB [callback]
   * @author Ramanavel Selvaraju
   */
  const updateAssemblerMetrics = (metrics, updateAssemMetricsCB) => {
    metrics.updateAttribute("assembled", metrics.sentEmails,
      (err, updatedMetrics) => {
        if(err) {
          logger.error({error: err, stack: err.stack,
                        input: {campaign: campaign}});
          return updateAssemMetricsCB(err);
        }
        return updateAssemMetricsCB(null);
    });
  };

  /**
   * Creates an entry on the clicked email model to get the report of
   * From which campaign, who, when, what link clicked
   *
   * @param  {[params]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[function]} addMetricsCB [callback function]
   * @return {[String]} msg [success message]
   * @author Aswin Raj
   */
  ListMetric.addMetrics = (reqParams, link, addListMetricsCB) => {
    async.waterfall([
      function getReqParams(getReqParamsCB) {
        getReqParamsCB(null, reqParams);
      },
      getListsForCampaign,
      updateListMetrics
    ], (asyncErr, result) => {
      if(asyncErr) {
        reqParams.error = asyncErr;
        logger.error("Error while updating list metrics", asyncErr);
        return addListMetricsCB(asyncErr);
      }
      addListMetricsCB(null, "List metric updated Successfully");
    });
  };

  /**
   * Get ListMetric By List Id
   * @param  {Number}   listId
   * @param  {Function} callback
   * @return {ListMetric}
   * @author Syed Sulaiman M
   */
  ListMetric.findByListIdAndCampaignId = (listId, campaignId, callback) => {
    ListMetric.find({
      where: {
        listId: listId,
        campaignId: campaignId
      }
    }, (listMetricsErr, listMetrics) => {
      if(listMetricsErr) return callback(listMetricsErr);
      return callback(null, listMetrics[0]);
    });
  };

  /**
   * Update Properties of a ListMetric
   *
   * @param  {ListMetric}   listMetric
   * @param  {Object}   properties
   * @param  {Function} callback
   * @return {ListMetric} Updated Instance
   * @author Syed Sulaiman M
   */
  ListMetric.updateProperties = (listMetric, properties, callback) => {
    listMetric.updateAttributes(properties, (metricErr, metric) => {
      return callback(metricErr, metric);
    });
  };

  /**
   * Get the list for the campaign in which the current person is linked to.
   * @param  {[reqParams]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[function]} getListsForCampaignCB
   * @return {[reqParams, personListsForCampaign]}
   * @author Aswin Raj
   */
  let getListsForCampaign = (reqParams, getListsForCampaignCB) => {
    async.waterfall([
      function getReqParams(getReqParamsCB) {
        getReqParamsCB(null, reqParams);
      },
      getAllListForPerson,
      getAllCampaignList
    ], (asyncErr, personListsForCampaign) => {
      if(asyncErr) {
        reqParams.error = asyncErr;
        logger.error("Error while geting lists for campaign", asyncErr);
        return getListsForCampaignCB(asyncErr);
      }
      getListsForCampaignCB(null, reqParams, personListsForCampaign);
    });
  };

  /**
   * Update / Create an entry in the listMetric Table for the lists that the
   * person belongs to, for the current campaign.
   * @param  {[reqParams]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[personListsForCampaign]} personLists belonging to the current Campaign
   * @param  {[function]} updateListMetricsCB    [description]
   * @return {[String]} msg [success message]
   * @author Aswin Raj
   */
  let updateListMetrics = (reqParams, personListsForCampaign,
    updateListMetricsCB) => {
    async.each(personListsForCampaign, (personListForCampaign,
      personListForCampaignCB) => {
      ListMetric.find({
        where: {
          and: [{
            campaignId: reqParams.campaignId
          }, {
            listId: personListForCampaign.id
          }]
        }
      }, (listMetricFindErr, listMetrics) => {
        if(listMetricFindErr) {
          reqParams.error = listMetricFindErr;
          logger.error("Error on updating ListMetric", listMetricFindErr);
          personListForCampaignCB(listMetricFindErr);
        }
        async.each(listMetrics, (listMetric, listMetricsCB) => {
          listMetric.updateAttribute("clicked", ++listMetric.clicked,
            (listMetricUpdateErr, listMetric) => {
              if(listMetricUpdateErr) {
                return listMetricsCB(listMetricUpdateErr);
              }
              listMetricsCB(null);
            });
        }, (err) => {
          if(err) {
            return personListForCampaignCB(err);
          }
          personListForCampaignCB(null);
        });
      });
    }, (err) => {
      if(err) {
        reqParams.error = err;
        logger.error("Error on updating ListMetric", err);
        return updateListMetricsCB(err);
      }
      return updateListMetricsCB(null, "List Metrics added Successfully");
    });
  };

  /**
   * Gets all the list for the current person
   * @param  {[params]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[function]} getAllListForPersonCB
   * @return {[reqParams, personLists]}
   * @author Aswin Raj
   */
  let getAllListForPerson = (reqParams, getAllListForPersonCB) => {
    ListMetric.app.models.person.findById(reqParams.personId,
      (personFindErr, person) => {
        if(personFindErr) {
          reqParams.error = personFindErr;
          logger.error("Error while finding person for person id",
            personFindErr);
          return getAllListForPersonCB(personFindErr);
        }
        person.lists((personListErr, personLists) => {
          if(personListErr) {
            reqParams.error = personListErr;
            logger.error("Error while finding lists for person", personListErr);
            return getAllListForPersonCB(personListErr);
          }
          getAllListForPersonCB(null, reqParams, personLists);
        });
      });
  };

  /**
   * Gets all the list of the current campaign for which the current person
   * belongs to
   * @param  {[params]} reqParams [{emailLinkId, personId, campaignId}]
   * @param  {[personLists]} personLists
   * @param  {[function]} getAllCampaignListCB [
   * @return {[personListForCampaign]} personListForCampaign
   * @author Aswin Raj
   */
  let getAllCampaignList = (reqParams, personLists, getAllCampaignListCB) => {
    ListMetric.app.models.campaign.findById(reqParams.campaignId,
      (campaignFindErr, campaign) => {
        if(campaignFindErr || !campaign) {
          reqParams.error = campaignFindErr;
          logger.error("Error while finding campaign", campaignFindErr);
          return getAllCampaignListCB(campaignFindErr);
        }
        campaign.lists((campaignListErr, campaignLists) => {
          if(campaignListErr || !campaignLists.length) {
            reqParams.error = campaignListErr;
            logger.error("Error while finding campaign lists", campaignListErr);
            return getAllCampaignListCB(campaignListErr);
          }
          let personListForCampaign = lodash
                              .intersectionBy(personLists, campaignLists, "id");
          getAllCampaignListCB(null, personListForCampaign);
        });
      });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  ListMetric.observe("before save", (ctx, next) => {
    if(ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else{
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
