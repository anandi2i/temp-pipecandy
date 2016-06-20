"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";
import campaignMetricArray from "../../server/utils/campaign-metric-fields";


module.exports = function(Campaign) {

  Campaign.remoteMethod(
    "saveCampaignTemplate",
    {
      description: "Save the campaign tempalate and associates with list",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "id",
        type: "any",
        required: true,
        http: {
          source: "path"
        }
      }, {
        arg: "reqParams",
        type: "object",
        required: true,
        http: {
          source: "body"
        }
      }],
      returns: {
        arg: "campaign",
        type: "campaign",
        root: true
      },
      http: {
        verb: "post",
        path: "/:id/saveCampaignTemplate"
      }
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
           }, (parallelErr, response) => {
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
    let subject = Campaign.app.models.campaignTemplate.personalize(
      template.subject, additionalValues);
    let content = Campaign.app.models.campaignTemplate.personalize(
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


  /**
   * Get the campaign metrics for the current campaign
   * @param  {[campaignId]} campaignId
   * @param  {[callback]} getCurrentCampaignMetricsCB
   * @return {[object]} currentCampaignMetricsData
   * @author Aswin Raj A
   */
  Campaign.getCurrentCampaignMetrics = (campaignId,
    getCurrentCampaignMetricsCB) => {
    Campaign.findById(campaignId, (CampaignErr, Campaigns) => {
      if (!Campaigns) {
        getCurrentCampaignMetricsCB(null,
          "There is no campaign with that campaignId");
      }
      Campaigns.campaignMetrics(
        (campaignMetricsErr, campaignMetricsData) => {
          if (campaignMetricsErr) {
            getCurrentCampaignMetricsCB(campaignMetricsErr);
          }
          Campaign.app.models.emailLink.find({
            where: {
              campaignId: campaignId
            }
          }, (err, emailLinks) => {
            const totalLinks = emailLinks.length;
            buildCampaignMetricObject(campaignMetricArray,
              campaignMetricsData, totalLinks,
              (err, campaignMetricsObj) => {
                getCurrentCampaignMetricsCB(null, campaignMetricsObj);
              });
          });
        });
    });
  };


  /**
   * Get Recent campaign metrics data fo the current user
   * @param  {[callback]} getRecentCampaignMetricsCB
   * @return {[object]} recentCampaignMetricsData
   * @author Aswin Raj A
   */
  Campaign.getRecentCampaignMetrics = (ctx, getRecentCampaignMetricsCB) => {
    const emptyCampaignMetricsData = {
      opened: 0,
      responded: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      spammed: 0,
      sentEmails: 0,
      failedEmails: 0,
      erroredEmails: 0
    };
    const totalEmptyLinks = 0;
    Campaign.find({
      where: {
        "createdBy": ctx.req.accessToken.userId
      },
      order: "lastrunat DESC",
      limit: 1
    }, (campaignErr, campaigns) => {
      if(campaignErr){
        logger.error(campaignErr);
        getRecentCampaignMetricsCB(campaignErr);
      }
      if(lodash.isEmpty(campaigns)){
        buildCampaignMetricObject(campaignMetricArray,
          emptyCampaignMetricsData, totalEmptyLinks,
          (err, campaignMetricsObj) => {
            getRecentCampaignMetricsCB(null, campaignMetricsObj);
        });
      } else {
        campaigns[0].campaignMetrics(
          (campaignMetricsErr, campaignMetricsData) => {
            if (campaignMetricsErr) {
              getRecentCampaignMetricsCB(campaignMetricsErr);
            }
            if(lodash.isEmpty(campaignMetricsData)){
              buildCampaignMetricObject(campaignMetricArray,
                emptyCampaignMetricsData, totalEmptyLinks,
                (err, campaignMetricsObj) => {
                  getRecentCampaignMetricsCB(null, campaignMetricsObj);
              });
            } else {
              Campaign.app.models.emailLink.find({
                where: {
                  campaignId: campaigns[0].campaignId
                }
              }, (err, emailLinks) => {
                const totalLinks = emailLinks.length;
                buildCampaignMetricObject(campaignMetricArray,
                  campaignMetricsData[0], totalLinks,
                  (err, campaignMetricsObj) => {
                    getRecentCampaignMetricsCB(null, campaignMetricsObj);
                  });
              });
            }
          });
      }
    });
  };

  /**
   * Build the campaign metric object for the recent campaign.
   * @param  {[campaignMetricArray]} campaignMetricArray
   * @param  {[campaignMetricsData]} campaignMetricsData
   * @param  {[totalLinks]} totalLinks
   * @param  {[callback]} buildCampaignMetricObjectCB [description]
   * @return campaign metric object
   * @author Aswin Raj A
   */
  let buildCampaignMetricObject = (campaignMetricArray,
    campaignMetricsData, totalLinks, buildCampaignMetricObjectCB) => {
    let campaignMetricObject = [];
    let openedRate = 0;
    const emptycount = 0;
    const hundredPercent = 100; //Denotes 100%

    async.eachSeries(campaignMetricArray,
      (campaignMetric, campaignMetricCB) => {
        let campaignMetricObj = {};
        //Construct object for each campaignMetricArray data and push it into
        //campaignMetricObject Array
        switch (campaignMetric) {
          case "OPENED":
            campaignMetricObj.title = "opened";
            openedRate = (campaignMetricsData.opened /
              (campaignMetricsData.sentEmails - campaignMetricsData.bounced))
              * hundredPercent;
            campaignMetricObj.percentage = openedRate || "0";
            campaignMetricObj.count = campaignMetricsData.opened || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "UNOPENED":
            campaignMetricObj.title = "unopened";
            campaignMetricObj.percentage = hundredPercent -
              (campaignMetricsData.opened /
                (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
              ) * hundredPercent || "0";
            campaignMetricObj.count =
              (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
              - campaignMetricsData.opened || "0";
            campaignMetricObj.class = "blue";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "CLICKED":
            campaignMetricObj.title = "clicked";
            campaignMetricObj.percentage = (totalLinks < emptycount) ? "0" :
            (campaignMetricsData.clicked
              / totalLinks) * hundredPercent || "0";
            campaignMetricObj.count = campaignMetricsData.clicked || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "3";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "ACTIONABLE RESPONSES":
            campaignMetricObj.title = "actionable responses";
            campaignMetricObj.percentage = "06";
            campaignMetricObj.count = "100";
            campaignMetricObj.class = "";
            campaignMetricObj.status = "";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "BOUNCED":
            campaignMetricObj.title = "bounced";
            campaignMetricObj.percentage = (campaignMetricsData.bounced
              / campaignMetricsData.sentEmails) * hundredPercent || "0";
            campaignMetricObj.count = campaignMetricsData.bounced || "0";
            campaignMetricObj.class = "red";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "UNSUBSCRIBED":
            campaignMetricObj.title = "unsubscribed";
            campaignMetricObj.percentage = (campaignMetricsData.unsubscribed
              / (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
            ) * hundredPercent || "0";
            campaignMetricObj.count = campaignMetricsData.unsubscribed || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "SPAM":
            campaignMetricObj.title = "spam";
            campaignMetricObj.percentage = (campaignMetricsData.spammed /
              (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
            ) * hundredPercent || "0";
            campaignMetricObj.count = campaignMetricsData.spammed || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          default:
            //Do nothing when there is no matched campaignMetricArray
            logger.info("No Metrics");
        };
        campaignMetricCB();
      },
      (err) => {
        logger.error(err);
        buildCampaignMetricObjectCB(null, campaignMetricObject);
      });
  };

  Campaign.remoteMethod(
    "getCurrentCampaignMetrics", {
      description: "Get recent campaign metrics for the current user",
      accepts: [{
        arg: "campaignId",
        type: "any"
      }],
      returns: {
        arg: "currentCampaignMetrics",
        type: "object"
      },
      http: {
        verb: "get",
        path: "/getCurrentCampaignMetrics/:campaignId"
      }
    }
  );


  Campaign.remoteMethod(
    "getRecentCampaignMetrics", {
      description: "Get recent campaign metrics for the current user",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }],
      returns: {
        arg: "recentCampaignMetrics",
        type: "object"
      },
      http: {
        verb: "get",
        path: "/getRecentCampaignMetrics"
      }
    }
  );

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
