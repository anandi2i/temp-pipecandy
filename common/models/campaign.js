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
   *  "campgin": {
   *
   *  },
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

//npm run calls
  /**
   * Generates email content and pushes to email to queue to send.
   * @param  {[campaign]} campaign [current campaign]
   * @param  {[person]} person [current person]
   * @param  {[Array]} listIds [listids of current campaign]
   * @param  {[function]} generateEmailCB [callback]
   * @author Ramanavel Selvaraju
   */
  Campaign.generateEmail = (campaign, person, listIds, generateEmailCB) => {
    async.waterfall([
      function(setArgs) {
        setArgs(null, campaign, person, listIds);
      },
      preaprePersonObject,
      getTemplate,
      applySmartTags,
      appendOpenTracker,
      appendLinkClickTracker,
      sendToEmailQueue
    ], (waterfallError) => {
      generateEmailCB(waterfallError);
    });
  };

  /**
   * Preapres person object with latest field values
   * @param  {[campaign]} campaign [current campaign]
   * @param  {[person]} person [current person]
   * @param  {[Array]} listIds [listids of current campaign]
   * @param  {[function]} preaprePersonCB [callback]
   * @return {List[additionalFieldValue]} [list of uniq field values]
   * @author Ramanavel Selvaraju
   */
  let preaprePersonObject = (campaign, person, listIds, preaprePersonCB) => {
    Campaign.app.models.person.preparePersonWithExtraFields(
      campaign, person, listIds, (preparePersonErr, fieldValues) => {
        return preaprePersonCB(preparePersonErr, campaign, person, fieldValues);
    });
  };

  /**
   * Gets the correct template for the person
   * logic:
   * find the campaignTemplate with person id and campign id to get the
   * personnalised template.
   * If not find the common template if that common template will not suites for
   * that person means that will go for missing tag temaplates.
   * If that also doesn't suites with the person object means that will
   * thorw an error to callback.
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[Array]} additionalValues [extra field values for that person]
   * @param  {[fucntion]} getTemplateCB    [callback]
   * @return {[CampaignTemplate]}  [CampaignTemplate object]
   * @author Ramanavel Selvaraju
   */
  let getTemplate = (campaign, person, additionalValues, getTemplateCB) => {
    Campaign.app.models.campaignTemplate.getPersonTemplate(campaign, person,
      (getPersonTemplateErr, personTemplate)=>{

      if(getPersonTemplateErr) {
        return getTemplateCB(getPersonTemplateErr);
      }

      if(personTemplate) {
        return getTemplateCB(null, campaign, person, additionalValues,
                                                              personTemplate);
      }

      Campaign.app.models.campaignTemplate.getCommonTemplates(campaign, person,
        additionalValues, (getCommonTemplatesErr, commonTemplate,
          missingTagIds) => {
          if(getCommonTemplatesErr) {
            return getTemplateCB(getCommonTemplatesErr);
          }

          if(!missingTagIds) {
            return getTemplateCB(null, campaign, person, additionalValues,
                                                                commonTemplate);
          }

          Campaign.app.models.campaignTemplate.getAlternateTemplate(campaign,
            person, additionalValues, missingTagIds,
            (getAlternateTemplateErr, template) => {
              if(getAlternateTemplateErr) {
              if(getAlternateTemplateErr.name !== "alternateTemplateNotFound") {
                return getTemplateCB(getAlternateTemplateErr);
              }
              }

              if(getAlternateTemplateErr) {
                return getTemplateCB(null, campaign, person, additionalValues,
                                                                commonTemplate);
              }

              return getTemplateCB(null, campaign, person, additionalValues,
                                                                  template);

            });//campaignTemplate.getAlternateTemplate

        });//campaignTemplate.getCommonTemplate

      });//campaignTemplate.getPersonTemplate
  }; //getTemplate

  /**
   * Applies smart tags with use of addional field values for the person
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[Array]} additionalValues [extra field values for that person]
   * @param  {[CampaignTemplate]} template [template which suites person object]
   * @param  {[function]} applySmartTagsCB [callabck]
   * @author Ramanavel Selvaraju
   */
  let applySmartTags = (campaign, person, additionalValues, template,
    applySmartTagsCB) => {
    let subject = Campaign.app.models.campaignTemplate.applySmartTags(
      template.subject, additionalValues);
    let content = Campaign.app.models.campaignTemplate.applySmartTags(
      template.content, additionalValues);

    let email = {
      subject: subject.template,
      content: content.template
    };
    if(subject.error || content.error){
      email.isError = true;
    }
    applySmartTagsCB(null, campaign, person, template, email);
  };

  /**
   * Appends an image url
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[Array]} additionalValues [extra field values for that person]
   * @param  {[CampaignTemplate]} template [template which suites person object]
   * @param  {[function]} applySmartTagsCB [callabck]
   * @author Ramanavel Selvaraju
   */
  let appendOpenTracker = (campaign, person, template, email,
    applyOpenTrackCB) => {

    applyOpenTrackCB(null, campaign, person, template, email);
  };

  let appendLinkClickTracker = (campaign, person,
    template, email, appendLinkClickTrackerCB) => {

    appendLinkClickTrackerCB(null, campaign, person, template, email);
  };

  let sendToEmailQueue = (campaign, person, template, email,
    sendToEmailQueueCB) => {

    Campaign.app.models.emailQueue.push(campaign, person, template, email,
      (pushErr) => {
        sendToEmailQueueCB(pushErr);
    });

  };

//observers
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
