"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";
import campaignMetricArray from "../../server/utils/campaign-metric-fields";
import statusCodes from "../../server/utils/status-codes";
import queueUtil from "../../server/mailCrawler/mailEnqueue";
import moment from "moment-timezone";
import config from "../../server/config.json";

const systemTimeZone = moment().format("Z");
const serverUrl = config.appUrl;

module.exports = function(Campaign) {

  Campaign.remoteMethod(
    "saveCampaignElements",
    {
      description: "Save the campaign tempalate and associates with list",
      accepts: [{
        arg: "ctx", type: "object", http: {source: "context"}
      }, {
        arg: "id", type: "any", required: true, http: {source: "path"}
      }, {
        arg: "reqParams", type: "object", required: true, http: {source: "body"}
      }],
      returns: {arg: "campaign", type: "campaign", root: true},
      http: {
        verb: "post", path: "/:id/saveCampaignElements"
      }
    }
  );

  /**
   * Saves the campaign templates with variations andperson wise template and
   * missing tag is wise templates also captures what are all the
   * smart tags utilized in each templates
   * Exmple reqParams:
   * http://www.jsoneditoronline.org/?id=4b60a0d140c9f30fef38de693d9fa26c
   *
   * @param  {[Context]} ctx [Context object to get accessToken]
   * @param  {[number]} id [campaign id]
   * @param  {[JSON]} reqParams [example shown above]
   * @param  {[function]} saveCampaignElementsCB
   * @return {[Campaign]} [Persisted Campaign Object]
   */
  Campaign.saveCampaignElements = (ctx, id, reqParams,
    saveCampaignElementsCB) => {
      async.waterfall([
        async.apply(validateSaveCampaignTemplate, ctx, id, reqParams),
        getCampaign,
        updateCampaign,
        reCreateCampaignElements,
        enqueueToMailAssembler
      ], (asyncErr, result) => {
        if(asyncErr){
          return saveCampaignElementsCB(asyncErr);
        }
        return saveCampaignElementsCB(null, result);
      });
    };


    /**
     * validates the request param object
     * @param  {[Object]} reqParams
     * @param  {[function]} validateSaveCB [callback]
     * @return {[void]}
     */
    const validateSaveCampaignTemplate = (ctx, id, reqParams,
      validateSaveCB) => {
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
      return validateSaveCB(null, ctx, id, reqParams);
    };

    /**
     * Get the campaign for the campaign id and for the current user
     * @param  {[ctx]} ctx
     * @param  {[id]} id
     * @param  {[reqParams]} reqParams
     * @param  {[function]} getCampaignCB
     * @return {[campaign, reqParams]}
     */
    const getCampaign = (ctx, id, reqParams, getCampaignCB) => {
      Campaign.find({
         where: {id: id, createdBy: ctx.req.accessToken.userId}
       }, (campaignErr, campaign) => {
         if(campaignErr | lodash.isEmpty(campaign)) {
           logger.error("Error in getting campaign for id : ",
           {
               campginId: id,
               reqParams:reqParams,
               error: parallelErr,
               stack: parallelErr ? parallelErr.stack : ""
           });
           return getCampaignCB(campaignErr);
         }
         return getCampaignCB(null, campaign[0], reqParams);
      });
    };


    /**
     * Update the current campaign with the scheduledAt, address, optText,
     * isAddressNeeded and isOptTextNeeded
     * @param  {[campaign]} campaign
     * @param  {[reqParams]} reqParams
     * @param  {[function]} updateCampaignCB
     * @return {[updatedCampaign, reqParams]}
     */
    const updateCampaign = (campaign, reqParams, updateCampaignCB) => {

      const campaignUpdateElements = {
        "scheduledAt" : formatDate(reqParams.campaign.scheduledDate,
          reqParams.campaign.scheduledTime),
        "address" : reqParams.campaign.address,
        "optText" : reqParams.campaign.optText,
        "isAddressNeeded": reqParams.campaign.isAddressNeeded,
        "isOptTextNeeded": reqParams.campaign.isOptTextNeeded,
        "statusCode": statusCodes.updated
      };
      campaign.updateAttributes(campaignUpdateElements,
        (campaignUpdateErr, updatedCampaign) => {
        if(campaignUpdateErr){
          logger.error("Error in updating campaign:", {
              error: campaignUpdateErr,
              stack: campaignUpdateErr.stack
          });
          return updateCampaignCB(campaignUpdateErr);
        }
        return updateCampaignCB(null, updatedCampaign, reqParams);
      });
    };


    /**
     * Function to convert the date string and time string into timeStamp formated Date
     * @param  {[dateString]} dateString
     * @param  {[timeString]} timeString
     * @return {[formatedDate]}
     */
    const formatDate = (dateString, timeString) => {
      const formatedDate = new Date(dateString + " " + timeString + " " +
       systemTimeZone);
      return formatedDate;
    };


    /**
     * To update the campaign elements when the user does some modifications to
     * the campaign we are deleting and recreating the campaign elements
     * - destroy the campaign elements such as emailQueue, campaignTemplate and
     *   followUp
     * - create the list, campaignTemplates and followUp
     * @param  {[campaign]} campaign
     * @param  {[reqParams]} reqParams
     * @param  {[function]} reCreateCampaignElementsCB
     * @return {[campaign]}
     */
    const reCreateCampaignElements = (campaign, reqParams,
      reCreateCampaignElementsCB) => {
      async.series({
        destroy: destroyCampaignElements.bind(null, campaign),
        create: createCampaignElements.bind(null, campaign, reqParams)
      }, (asyncErr, results) => {
        if(asyncErr){
          logger.error("Error on reCreateCampaignElements : ",
               {campginId: campaign.id, reqParams:reqParams,
                 error: asyncErr, stack: asyncErr.stack});
           return reCreateCampaignElementsCB(asyncErr);
        }
        reCreateCampaignElementsCB(null, campaign);
      });
    };


    /**
     * In the recreation of the campaign, we need to delete the campaign
     * elements before updating
     * @param  {[campaign]} campaign
     * @param  {[function]} destroyCampaignElementsCB
     */
    const destroyCampaignElements = (campaign, destroyCampaignElementsCB) => {
      async.parallel({
        emailQueue: Campaign.app.models.emailQueue.destroyByCampaign
        .bind(null, campaign),
        campaignTemplate: Campaign.app.models.campaignTemplate.destroyByCampaign
        .bind(null, campaign),
        followUp: Campaign.app.models.followUp.destroyByCampaign
        .bind(null, campaign)
      }, (asyncErr, results) => {
        if(asyncErr){
          logger.error("Error while destroying campaign elements",
          {error: asyncErr, stack: asyncErr.stack});
          return destroyCampaignElementsCB(asyncErr);
        }
        return destroyCampaignElementsCB(null);
      });
    };


    /**
     * After deleting the campaign elements we need to create the campign
     * elements with the updated objects
     * List, Campaign Template and FollowUp needs to be updated
     * @param  {[campaign]} campaign
     * @param  {[reqParams]} reqParams
     * @param  {[type]} reCreateCampaignElementsCB
     */
    const createCampaignElements = (campaign, reqParams,
      reCreateCampaignElementsCB) => {
      async.parallel({
      list: Campaign.app.models.list.associateList
      .bind(null, campaign, reqParams.listIds),
      templates: Campaign.app.models.campaignTemplate.saveTemplates
      .bind(null, campaign, reqParams.campaignTemplates),
      followUp: Campaign.app.models.followUp.createFollowUpElements
      .bind(null, campaign, reqParams.followUps)
      }, (parallelErr, response) => {
        if(parallelErr){
          logger.error("Error on saveCampaignTemplate : ",
          {campginId: campaign.id, reqParams:reqParams, error: parallelErr,
            stack: parallelErr ? parallelErr.stack : ""});
           return reCreateCampaignElementsCB(parallelErr);
        }
        return reCreateCampaignElementsCB(null, response);
      });
    };


    /**
     * Once the campaign elements are created, enqueue the campaign to the
     * mail assembler
     * @param  {[campaign]} campaign
     * @param  {[function]} enqueueToMailAssemblerCB
     */
    const enqueueToMailAssembler = (campaign, enqueueToMailAssemblerCB) => {
      let queueName = "mailAssemblerQueue";
      queueUtil.enqueueMail(JSON.stringify(campaign), queueName,
        () => {
          campaign.updateAttribute("statusCode", statusCodes.enqueued,
          (campaignUpdateErr, updatedCampaign) => {
            if(campaignUpdateErr){
              logger.error("Error on updating campaign : ", {campaign: campaign,
                 error: campaignUpdateErr, stack: campaignUpdateErr.stack});
               return enqueueToMailAssemblerCB(campaignUpdateErr);
            }
          });
          return enqueueToMailAssemblerCB(null,
            "Campaign details saved successfully!");
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
      appendUnsubscribeLink,
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
  const getTemplate = (campaign, person, additionalValues, getTemplateCB) => {
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
  const applySmartTags = (campaign, person, additionalValues, template,
    applySmartTagsCB) => {
    Campaign.app.models.campaignTemplate.personalize(
      template.subject, additionalValues,
      (subjectPersonalizeError, subject) => {
        if(subjectPersonalizeError) {
          let email = {
            subject: subject,
            content: template.content,
            isError: true
          };
          return applySmartTagsCB(null, campaign, person, template, email);
        }
        Campaign.app.models.campaignTemplate.personalize(
          template.content, additionalValues,
          (contentPersonalizeError, content) => {
            if(contentPersonalizeError) {
              let email = {
                subject: subject,
                content: template.content,
                isError: true
              };
              return applySmartTagsCB(null, campaign, person, template, email);
            }
            let email = {
              subject: subject,
              content: content,
              isError: false
            };
            return applySmartTagsCB(null, campaign, person, template, email);
          });
      });
  };

  /**
   * Appends an Unsubscribe Link URL
   * Based on isOptTextNeeded flag Unsubscribe Link will be appended
   * 	 to the email to be sent
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[Array]} additionalValues [extra field values for that person]
   * @param  {[CampaignTemplate]} template [template which suites person object]
   * @param  {[function]} applyUnsubscribeLinkCB Callback function
   * @author Syed Sulaiman M
   */
  const appendUnsubscribeLink = (campaign, person, template, email,
        appendUnsubscribeLinkCB) => {
    if(campaign.isOptTextNeeded) {
      let trackerContent = email.content;
      let url = `${serverUrl}/api/`;
      url += `people/${person.id}/`;
      url += `user/${campaign.createdBy}/`;
      url += `campaign/${campaign.id}/unsubscribe`;
      let trackerTag = `<a href='${url}'>${campaign.optText}</a>`;
      trackerContent += trackerTag;
      email.content = trackerContent;
    }
    appendUnsubscribeLinkCB(null, campaign, person, template, email);
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
  const appendOpenTracker = (campaign, person, template, email,
    applyOpenTrackCB) => {
    let trackerContent = email.content;
    let url =
  `${serverUrl}/api/campaign/${campaign.id}/person/${person.id}/trackEmail.png`;
    let trackerTag = `<img src='${url}'/>`;
    trackerContent += trackerTag;
    email.content = trackerContent;
    applyOpenTrackCB(null, campaign, person, template, email);
  };

  /**
   * Applies the click tracking machnaisam
   *
   * @param  {[type]} campaign                 [description]
   * @param  {[type]} person                   [description]
   * @param  {[type]} template                 [description]
   * @param  {[type]} email                    [description]
   * @param  {[type]} appendLinkClickTrackerCB [description]
   * @return {[type]}                          [description]
   * @author Ramanavel Selvaraju
   */
  const appendLinkClickTracker = (campaign, person,
    template, email, appendLinkClickTrackerCB) => {
    let hrefTags = email.content.match(/href=("|')(.*?)("|')/g);
    async.eachSeries(hrefTags, (href, hrefTagsCB) => {
      href = lodash.replace(href, /("|')/g, `"`);
      let linkurl = href.split(/"/)[1];
      Campaign.app.models.emailLink.getOrSave(campaign, linkurl,
        (getOrSaveErr, link) => {
          if(getOrSaveErr) {
            return hrefTagsCB(getOrSaveErr);
          }
          let content = email.content;
          let proxyUrl = `${serverUrl}/api/clickedEmailLinks/${link.id}`;
          proxyUrl += `/campaign/${campaign.id}/person/${person.id}/track`;
          content = lodash.replace(content, linkurl, proxyUrl);
          email.content = content;
          hrefTagsCB(null);
      });
    }, (eachSeriesErr) => {
      return appendLinkClickTrackerCB(null, campaign, person, template, email);
    });

  };

  const sendToEmailQueue = (campaign, person, template, email,
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
        getRecentCampaignMetricsCB(null);
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
  const buildCampaignMetricObject = (campaignMetricArray,
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
   * Get campaign details for the recent campaign
   * @param  {[callback]} getRecentCampaignDetailsCB
   * @return {[object]} recentCampaignDetailsObj
   * @author Aswin Raj A
   */
  Campaign.getRecentCampaignDetails = (ctx, getRecentCampaignDetailsCB) => {
    let recentCampaignDetailsObj = {};
    let peopleArray = [];
    Campaign.find({
      where: {
        "createdBy": ctx.req.accessToken.userId
      },
      order: "lastrunat DESC",
      limit: 1
    }, (campaignErr, campaigns) => {
      if(campaignErr){
        getRecentCampaignDetailsCB(campaignErr);
      }

      if(lodash.isEmpty(campaigns)){
        return getRecentCampaignDetailsCB(null);
      }

      const recentCampaign = campaigns[0];
      recentCampaignDetailsObj.campaignName = recentCampaign.name;
      recentCampaignDetailsObj.executedAt = new Date(recentCampaign.lastRunAt);
      campaigns[0].lists((campaignListErr, campaignLists) => {
        recentCampaignDetailsObj.listCount = campaignLists.length;
        async.eachSeries(campaignLists, (campaignList, campaignListCB) => {
          campaignList.people((personErr, people) => {
            async.eachSeries(people, (person, peopleSeriesCB) => {
              peopleArray.push(lodash.pick(person, "id"));
              peopleSeriesCB(null);
            }, (seriesErr) => {
              if(seriesErr){
                campaignListCB(seriesErr);
              }
              campaignListCB(null);
            });
          });

        }, (campaignListsErr) => {
          if(campaignListsErr){
            campaignListCB(campaignListsErr);
          }
          recentCampaignDetailsObj.recepientCount = lodash
                                          .uniqBy(peopleArray, "id").length;
          getRecentCampaignDetailsCB(null, recentCampaignDetailsObj);
        });
      });
  });

};

  Campaign.remoteMethod(
    "getRecentCampaignDetails", {
      description: "Get recent campaign details for the current user",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }],
      returns: {
        arg: "recentCampaignDetails",
        type: "object"
      },
      http: {
        verb: "get",
        path: "/getRecentCampaignDetails"
      }
    }
  );


  /**
   * Get the campaign details for the current campaign
   * @param  {[campaignId]} campaignId
   * @param  {[callback]} getCurrentCampaignDetailsCB
   * @return {[object]} currentCampaignDetailsObj
   * @author Aswin Raj A
   */
  Campaign.getCurrentCampaignDetails = (campaignId,
    getCurrentCampaignDetailsCB) => {
    let currentCampaignDetailsObj = {};
    let peopleArray = [];
    Campaign.findById(campaignId, (campaignErr, campaign) => {
      if(campaignErr){
        getCurrentCampaignDetailsCB(campaignErr);
      }
      currentCampaignDetailsObj.campaignName = campaign.name;
      currentCampaignDetailsObj.executedAt = new Date(campaign.lastRunAt);
      campaign.lists((campaignListsErr, campaignList) => {
        currentCampaignDetailsObj.listCount = campaignList.length;
        async.eachSeries(campaignList, (campaignList, campaignListCB) => {
          campaignList.people((personErr, people) => {
            async.eachSeries(people, (person, peopleSeriesCB) => {
              peopleArray.push(lodash.pick(person, "id"));
              peopleSeriesCB(null);
            }, (seriesErr) => {
              if(seriesErr){
                campaignListCB(seriesErr);
              }
              campaignListCB(null);
            });
          });

        }, (campaignListsErr) => {
          currentCampaignDetailsObj.recepientCount = lodash
                                            .uniqBy(peopleArray, "id").length;
          getCurrentCampaignDetailsCB(null, currentCampaignDetailsObj);
        });
      });
    });
  };


    Campaign.remoteMethod(
      "getCurrentCampaignDetails", {
        description: "Get current campaign details for the current campaign",
        accepts: [{
          arg: "campaignId",
          type: "any"
        }],
        returns: {
          arg: "currentCampaignDetails",
          type: "object"
        },
        http: {
          verb: "get",
          path: "/getCurrentCampaignDetails/:campaignId"
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
