"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";

module.exports = function(Campaign) {

  Campaign.remoteMethod(
    "saveCampaignTemplate",
    {
      description: "Save the campaign tempalate and associates with list",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "id", type: "any", required: true,
          http: {source: "path"}
        },
        {
          arg: "reqParams", type: "object", required: true,
          http: {source: "body"}
        }
      ],
      returns: {arg: "campaign", type: "campaign", root: true},
      http: {verb: "post", path: "/:id/saveCampaignTemplate"}
    }
  );

  /**
   * Saves the campaign templates with variations andperson wise template and
   * missing tag is wise templates also captures what are all the
   * smart tags utilized in each templates
   * Exmple reqParams:
   * {
   *  "listIds": [1,2,3],
   *  "campaignTemplates": [
   *    {
   *      "subject": "Test Subject",
   *      "content": "Test Content",
   *      "usedTagIds": "1|2|3|4",
   *      "userId": 1
   *    },
   *    {
   *      "subject": "Test Subject",
   *      "content": "Test Content",
   *      "usedTagIds": "1|2|3|4",
   *      "userId": 1,
   *      "personId": 1
   *    },
   *    {
   *      "subject": "Test Subject",
   *      "content": "Test Content",
   *      "missingTagIds": "1|2",
   *      "usedTagIds": "3|4",
   *      "userId": 1
   *    }
   *  ]
   *}
   *
   * @param  {[Context]} ctx [Context object to get accessToken]
   * @param  {[number]} id [campaign id]
   * @param  {[JSON]} reqParams [example shown above]
   * @param  {[function]} saveCampaignTemplateCB
   * @return {[Campaign]} [Persisted Campaign Object]
   */
  Campaign.saveCampaignTemplate = (ctx, id, reqParams,
    saveCampaignTemplateCB) => {
      validateSaveCampaignTemplate(reqParams, (validationError) => {
        if(validationError) {
          logger.error("Error in validation : ",
               {campginId: id, reqParams:reqParams, error: validationError});
          return saveCampaignTemplateCB(validationError);
        }
        Campaign.find({
           where: {id: id, createdBy: ctx.req.accessToken.userId}
         }, (campaignErr, campaign) => {
           if(campaignErr | lodash.isEmpty(campaign)) {
             logger.error("Error in getting campaign for id : ",
                  {campginId: id, reqParams:reqParams, error: parallelErr});
             return saveCampaignTemplateCB(campaignErr);
           }
           async.parallel({
           saveList: associateList.bind(null, campaign[0], reqParams.listIds),
           saveTemplates: saveTemplates.bind(null, campaign[0],
               reqParams.campaignTemplates)
           }, function (parallelErr, response) {
             if(parallelErr){
               logger.error("Error on saveCampaignTemplate : ",
                    {campginId: id, reqParams:reqParams, error: parallelErr});
             }
             saveCampaignTemplateCB(parallelErr, response);
           });
        });
      });
    };

    /**
     * validates the request param object
     * @param  {[Object]} reqParams
     * @param  {[function]} validateSaveCB [callback]
     * @return {[void]}
     */
    let validateSaveCampaignTemplate = (reqParams, validateSaveCB) => {
      if(!reqParams.hasOwnProperty("listIds")){
        let error = new Error();
        error.message = "listIds not found in the input object";
        error.name = "listIdsNotFound";
        return validateSaveCB(error);
      }
      if(!reqParams.hasOwnProperty("campaignTemplates")) {
        let error = new Error();
        error.message = "campaignTemplates not found in the input object";
        error.name = "campaignTemplatesNotFound";
        return validateSaveCB(error);
      }
      return validateSaveCB(null);
    };

  /**
   * associating the ListIds with campgin
   *
   * @param  {[Campaign]} campaign
   * @param  {List[number]} listIds
   * @param  {[function]} associateListCB [callback function]
   * @return {void}
   * @author Ramanavel Selvaraju
   */
  let associateList = (campaign, listIds, associateListCB) => {
   async.each(listIds, (listId, listEachCB) => {
     campaign.lists.add(listId, (listAddErr) => {
       if(listAddErr) {
         logger.error("Error on associating the list : ",
            {campaign: campaign, listId: listId, error: listAddErr});
       }
       listEachCB(listAddErr);
     });
   }, (listEachErr) => {
      associateListCB(listEachErr);
   });
  };

  /**
   * Saves the campaing templates using campgin object
   *
   * @param  {[Campaign]} campaign
   * @param  {[List[campaignTemplate]]} campaignTemplates
   * @param  {[function]} saveTemplatesCB   [callback function]
   * @return {[List[campaignTemplate]]} [persisted campaignTemplates]
   * @author Ramanavel Selvaraju
   */
  let saveTemplates = (campaign, campaignTemplates, saveTemplatesCB) => {
    campaign.campaignTemplates.create(campaignTemplates,
      (campaignTemplatesCreateErr, persistedCampaignTemplates) => {
        if(campaignTemplatesCreateErr) {
          logger.error("Error on saving CampaignTemplates : ", {
              campaign: campaign,
              campaignTemplates: campaignTemplates,
              error: campaignTemplatesCreateErr
            });
        }
        saveTemplatesCB(campaignTemplatesCreateErr, persistedCampaignTemplates);
    });
  };

  /**
   * Returns Uniq People using campaignId
   * @param  {integer} campaignId
   * @param  {function} getPeopleCallback
   * @return {[Array[Person], campaign]}
   */
  Campaign.getPeopleByCampaignId = (campaignId, getPeopleCallback) => {
    let people = [];
    Campaign.findById(campaignId, (campaignError, campaign) => {
      if (campaignError) {
        getPeopleCallback(campaignError);
      }
      campaign.lists((listError, lists) => {
        if (listError) {
          getPeopleCallback(listError);
        }
        async.each(lists, (list, listCallBack) => {
          list.people((peopleListErr, peopleList) => {
            people = people.concat(peopleList);
            listCallBack();
          });
        }, (asyncEachErr) => {
          getPeopleCallback(asyncEachErr, lodash.uniqBy(people, "id"),
           campaign);
        });
      });
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  Campaign.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

};
