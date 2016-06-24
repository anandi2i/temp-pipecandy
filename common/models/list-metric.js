"use strict";

import logger from "../../server/log";
import lodash from "lodash";
import async from "async";

module.exports = function(ListMetric) {

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
