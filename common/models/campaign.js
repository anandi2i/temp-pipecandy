"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";
import moment from "moment-timezone";
import campaignMetricArray from "../../server/utils/campaign-metric-fields";
import statusCodes from "../../server/utils/status-codes";
import queueUtil from "../../server/emailReader/mailEnqueue";
import config from "../../server/config.json";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import striptags from "striptags";

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

    Campaign.remoteMethod(
      "stop",
      {
        description: "Save the campaign tempalate and associates with list",
        accepts: [
          {arg: "ctx", type: "object", http: {source: "context"}},
          {arg: "id", type: "number", required: true, http: {source: "path"}}
        ],
        returns: {arg: "campaign", type: "campaign", root: true},
        http: {verb: "put", path: "/:id/stop"}
      }
    );

    /**
     * Stops the Campaign
     * Campaign Status will be updated to Stop
     *
     * @param  {Context} ctx [Context object to get accessToken]
     * @param  {number} id [campaign id]
     * @param  {Function} callback
     * @return {Campaign} [Persisted Campaign Object]
     * @author Syed Sulaiman M
     */
    Campaign.stop = (ctx, id, callback) => {
      Campaign.find({
        where: {
          and: [
            {createdBy:ctx.req.accessToken.userId},
            {id:id}
          ]
        }
      }, (campaignsErr, campaigns) => {
        if(campaignsErr || lodash.isEmpty(campaigns)) {
          const errorMessage = lodash.isEmpty(campaigns) ?
              errorMessages.INVALID_CAMPAIGN_ID : errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        let campaign = campaigns[0];
        campaign.updateAttribute("statusCode", statusCodes.campaignStopped,
            (updateErr, updatedCampaign) => {
          if(updateErr) {
            const errorMessage = errorMessages.SERVER_ERROR;
            return callback(errorMessage);
          }
          Campaign.app.models.followUp
              .updateStoppedByCampaignId(updatedCampaign.id, true,
              (updateErr, result) => {
            if(updateErr) {
              const errorMessage = errorMessages.SERVER_ERROR;
              return callback(errorMessage);
            }
            return callback(null, updatedCampaign);
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
        "address" : reqParams.campaign.address,
        "optText" : reqParams.campaign.optText,
        "isAddressNeeded": reqParams.campaign.isAddressNeeded,
        "isOptTextNeeded": reqParams.campaign.isOptTextNeeded,
        "statusCode": statusCodes.updated
      };
      if(reqParams.campaign.scheduledTime || reqParams.campaign.scheduledDate) {
        campaignUpdateElements.scheduledAt = formatDate(
          reqParams.campaign.scheduledDate, reqParams.campaign.scheduledTime);
      }
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
      let queueName = "emailAssembler";
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
  Campaign.generateEmail = (campaign, person, listIds, followup,
     generateEmailCB) => {
    async.waterfall([
      function(setArgs) {
        setArgs(null, campaign, person, listIds, followup);
      },
      preaprePersonObject,
      getTemplate,
      applySmartTags,
      appendOpenTracker,
      appendLinkClickTracker,
      // appendUnsubscribeLink,
      prepareScheduledAt,
      preapreFollowUp,
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
  const preaprePersonObject = (campaign, person, listIds, followup,
    preaprePersonCB) => {
    Campaign.app.models.person.preparePersonWithExtraFields(
      campaign, person, listIds, (preparePersonErr, fieldValues) => {
        return preaprePersonCB(preparePersonErr, campaign, person, fieldValues,
          followup);
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
  const getTemplate = (campaign, person, additionalValues, followup,
     getTemplateCB) => {
    Campaign.app.models.campaignTemplate.getPersonTemplate(campaign, person,
      followup, (getPersonTemplateErr, personTemplate)=>{

      if(getPersonTemplateErr) {
        return getTemplateCB(getPersonTemplateErr);
      }

      if(personTemplate) {
        return getTemplateCB(null, campaign, person, additionalValues,
                                                  personTemplate, followup);
      }

      Campaign.app.models.campaignTemplate.getCommonTemplates(campaign, person,
        additionalValues, followup, (getCommonTemplatesErr, commonTemplate,
          missingTagIds) => {
          if(getCommonTemplatesErr) {
            return getTemplateCB(getCommonTemplatesErr);
          }

          if(!missingTagIds) {
            return getTemplateCB(null, campaign, person, additionalValues,
                                                    commonTemplate, followup);
          }

          Campaign.app.models.campaignTemplate.getAlternateTemplate(campaign,
            person, additionalValues, missingTagIds, followup,
            (getAlternateTemplateErr, template) => {
              if(getAlternateTemplateErr) {
              if(getAlternateTemplateErr.name !== "alternateTemplateNotFound") {
                return getTemplateCB(getAlternateTemplateErr);
              }
              }

              if(getAlternateTemplateErr) {
                return getTemplateCB(null, campaign, person, additionalValues,
                                                commonTemplate, followup);
              }

              return getTemplateCB(null, campaign, person, additionalValues,
                                                  template, followup);

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
    followup, applySmartTagsCB) => {
    let email = {
      subject: template.subject, content: template.content, isError: false,
      email: person.email, campaignTemplateId: template.id,
      campaignId: campaign.id, userId: campaign.createdBy, personId: person.id
    };
    async.parallel({
      subject: Campaign.app.models.campaignTemplate.personalize.bind(null,
        email.subject, additionalValues),
      content: Campaign.app.models.campaignTemplate.personalize.bind(null,
        email.content, additionalValues)
    }, (parallelErr, result) => {
      email.isError = parallelErr? true : email.isError;
      if(result){
        email.subject = result.subject ? result.subject : email.subject;
        email.content = result.content ? result.content : email.content;
      }
      return applySmartTagsCB(null, campaign, followup, person, email);
    });
  };

  /**
   * Appends an Unsubscribe Link URL
   * Based on isOptTextNeeded flag Unsubscribe Link will be appended
   * to the email to be sent
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[Array]} additionalValues [extra field values for that person]
   * @param  {[CampaignTemplate]} template [template which suites person object]
   * @param  {[function]} applyUnsubscribeLinkCB Callback function
   * @author Syed Sulaiman M
   */
  // const appendUnsubscribeLink = (campaign, followup, person, email,
  //       appendUnsubscribeLinkCB) => {
  //   if(followup){
  //     return appendUnsubscribeLinkCB(null, campaign, followup, person, email);
  //   }
  //   if(campaign.isOptTextNeeded) {
  //     let trackerContent = email.content;
  //     let url = `${serverUrl}/api/`;
  //     url += `people/${person.id}/`;
  //     url += `user/${campaign.createdBy}/`;
  //     url += `campaign/${campaign.id}/unsubscribe`;
  //     let trackerTag = `<a href='${url}'>${campaign.optText}</a>`;
  //     trackerContent += trackerTag;
  //     email.content = trackerContent;
  //   }
  //   return appendUnsubscribeLinkCB(null, campaign, followup, person, email);
  // };

  /**
   * Appends an image url to track the person whether he opens our email or not
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[Array]} additionalValues [extra field values for that person]
   * @param  {[function]} applySmartTagsCB [callabck]
   * @author Ramanavel Selvaraju
   */
  const appendOpenTracker = (campaign, followup, person, email,
    applyOpenTrackCB) => {
    let trackerContent = email.content;
    let url =
  `${serverUrl}/api/campaign/${campaign.id}/person/${person.id}/trackEmail.png`;
    if(followup) {
      url += `?followUpId=${followup.id}`;
    }
    let trackerTag = `<img src='${url}'/>`;
    trackerContent += trackerTag;
    email.content = trackerContent;
    applyOpenTrackCB(null, campaign, followup, person, email);
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
  const appendLinkClickTracker = (campaign, followup, person, email,
     appendLinkClickTrackerCB) => {
    let hrefTags = email.content.match(/href=("|')(.*?)("|')/g);
    async.eachSeries(hrefTags, (href, hrefTagsCB) => {
      href = lodash.replace(href, /("|')/g, `"`);
      let linkurl = href.split(/"/)[1];
      Campaign.app.models.emailLink.getOrSave(campaign, linkurl, followup,
        (getOrSaveErr, link) => {
        if(getOrSaveErr) {
          return hrefTagsCB(getOrSaveErr);
        }
        let content = email.content;
        let proxyUrl = `${serverUrl}/api/clickedEmailLinks/${link.id}`;
        proxyUrl += `/campaign/${campaign.id}/person/${person.id}/track`;
        if(followup) {
          proxyUrl += `?followUpId=${followup.id}`;
        }
        content = lodash.replace(content, linkurl, proxyUrl);
        email.content = content;
        hrefTagsCB(null);
      });
    }, (eachSeriesErr) => {
      email.isError = eachSeriesErr? true : email.isError;
      return appendLinkClickTrackerCB(null, campaign, followup, person, email);
    });

  };

  /**
   * Preparering ScheduledAt for Individual
   * Assuming followup object will have scheduledAt always
   *
   * @param campaign
   * @param followUp
   * @param person
   * @param function prepare ScheduledAt Callback
   * @author Ramanavel Selvaraju
   */
  const prepareScheduledAt = (campaign, followup, person, email,
    prepareScheduledAtCB) => {
    const scheduledAtFromUser = followup ? followup.scheduledAt
                                       : campaign.scheduledAt;
    let scheduledAt = new Date();
    try {
      if (scheduledAtFromUser) {
        if (person.time_zone) {
          const personZoneTime = moment(scheduledAtFromUser)
                            .tz(person.time_zone).format("YYYY-MM-DDTHH:mm:ss");
          scheduledAt = new Date(personZoneTime + moment().format("Z"));
          const ten = -10;
          const diff = scheduledAt
                            - new Date(moment(new Date()).add(ten, "minutes"));
          const zero = 0;
          const one = 1;
          if(!lodash.gt(diff, zero)) {
            scheduledAt = new Date(moment(scheduledAt).add(one, "days").format);
          }
        } else {
          scheduledAt = new Date(scheduledAtFromUser);
        }
      }
      email.scheduledAt = scheduledAt;
      prepareScheduledAtCB(null, campaign, followup, person, email);
    } catch (prepareScheduledAtERR) {
      logger.error({
        error: prepareScheduledAtERR,
        email: email,
        stack: prepareScheduledAtERR.stack
      });
      email.isError = true;
      prepareScheduledAtCB(null, campaign, followup, person, email);
    }
  };

  /**
   * Prepares the FollowUp email subject and the content
   * Followup Subject will be the same as the previous mail which we sent
   *
   * @param  {[Campaign]} campaign
   * @param  {[FollowUp]} followup
   * @param  {[Person]} person
   * @param  {[CampaignTemplate]} template
   * @param  {[Object]} email
   * @param  {[function]} sendToEmailQueueCB
   * @return void
   * @author Ramanavel Selvaraju
   */
  const preapreFollowUp = (campaign, followup, person, email,
    preapreFollowUpCB) => {
      if(!followup) {
        return preapreFollowUpCB(null, campaign, followup, person, email);
      }
      async.parallel({
        campaignAudit: Campaign.app.models.followUp.preapreSubject.bind(null,
          campaign, person, email, followup),
        content: Campaign.app.models.followUp.preapreContent.bind(null,
          campaign, person, email, followup)
      }, (parallelErr, result) => {
        email.isError = parallelErr ? true : email.isError;
        if(result){
          const audit = result.campaignAudit;
          email.subject = audit ? audit.subject : email.subject;
          email.content = result.content ? email.content + result.content
                                         : email.content;
          email.threadId = audit ? audit.threadId : null;
        }
        return preapreFollowUpCB(null, campaign, followup, person, email);
      });
  };

  /**
   * send the email to the sending Queue
   *
   * @param  {[Campaign]} campaign
   * @param  {[FollowUp]} followup
   * @param  {[Person]} person
   * @param  {[CampaignTemplate]} template
   * @param  {[Object]} email
   * @param  {[function]} sendToEmailQueueCB
   * @return void
   * @author Ramanavel Selvaraju
   */
  const sendToEmailQueue = (campaign, followup, person, email,
    sendToEmailQueueCB) => {
    email.subject = email.subject.replace(/&nbsp;/g, " ");
    email.subject = lodash.trim(striptags(email.subject));
    Campaign.app.models.emailQueue.create(email,
      (emailQueueErr, emailQueueObj) => {
      if (emailQueueErr) {
        return sendToEmailQueueCB(emailQueueErr);
      }
      logger.info("Pushed Email to the Queue", emailQueueObj);
      sendToEmailQueueCB();
    });

  };

  /**
   * updates given status code in give campaign object
   *
   * @param  {[type]} campaign       [description]
   * @param  {[type]} code           [description]
   * @param  {[function]} updateStatusCB [callback]
   * @return {[campaign]}                [campaignUpdated]
   * @author Ramanavel Selvaraju
   */
  Campaign.updateStatusCode = (campaign, code, updateStatusCB) => {
    campaign.updateAttribute("statusCode", code, (err, campaignUpdated) => {
        return updateStatusCB(err, campaignUpdated);
    });
  };

  /**
   * validates status codes before generating a campaign or a followup
   *
   * @param  {[campaign]} campaign
   * @param  {[followup]} followup
   * @param  {[function]} statusCheckCB [callabck]
   * @return {[type]}               [description]
   * @author Ramanavel Selvaraju
   */
  Campaign.validateStatus = (campaign, followup, statusCheckCB) => {
    const msg = `Status not Matching Aborting! CampaignId : ${campaign.id}`;
    let error = new Error(msg);
    error.name = "StatusMismatchError";
    if(followup) {
      if(campaign.statusCode < statusCodes.readyToSend){
        return statusCheckCB(error);
      }
    } else {
      if(campaign.statusCode !== statusCodes.processing){
        return statusCheckCB(error);
      }
    }
    return statusCheckCB(null, true);
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
            logger.error("Error while finding campaign merics");
            getCurrentCampaignMetricsCB(campaignMetricsErr);
          }
          Campaign.app.models.emailLink.find({
            where: {
              campaignId: campaignId
            }
          }, (err, emailLinks) => {
            const totalLinks = emailLinks.length;
            buildCampaignMetricObject(campaignMetricArray,
              campaignMetricsData[0], totalLinks,
              (err, campaignMetricsObj) => {
                getCurrentCampaignMetricsCB(null, campaignMetricsObj);
              });
          });
        });
    });
  };



  Campaign.remoteMethod(
    "hasRecentCampaign",
    {
      description: "To check if there is any recent campaign for the user",
      accepts: [{
        arg: "ctx", type: "object", http: {source: "context"}
      }],
      returns: {arg: "hasCampaign", type: "boolean"},
      http: {
        verb: "get", path: "/hasRecentCampaign"
      }
    }
  );

  /**
   * To check if there is any recent campaign for the current user
   * @param  {[ctx]}  ctx
   * @param  {function} hasRecentCampaignCB
   * @return {[boolean]} hasRecentCampaign
   * @author Aswin Raj A
   */
  Campaign.hasRecentCampaign = (ctx, hasRecentCampaignCB) => {
    Campaign.find({
      where: {
        and:[
          {"createdBy": ctx.req.accessToken.userId},
          {"lastRunAt": {neq: null}}
        ]
      },
      order: "lastRunAt DESC",
      limit: 1
    }, (campaignErr, campaigns) => {
      if(campaignErr){
        logger.error(campaignErr, {
            user: ctx.req.accessToken.userId,
            error: campaignErr,
            stack: campaignErr ? campaignErr.stack : ""
        });
        const errorMessage = errorMessages.SERVER_ERROR;
        hasRecentCampaignCB(errorMessage);
      }
      if(lodash.isEmpty(campaigns)){
        return hasRecentCampaignCB(null, false);
      }
      return hasRecentCampaignCB(null, true);
    });
  };



  Campaign.remoteMethod(
    "doesCampaignExist",
    {
      description: "To check if there is any campaign for the campaign id",
      accepts: [{
        arg: "campaignId", type: "any"
      }],
      returns: {arg: "hasCampaign", type: "boolean"},
      http: {
        verb: "get", path: "/:campaignId/doesCampaignExist"
      }
    }
  );

  /**
   * To check if there is any recent campaign for the current user
   * @param  {[campaignId]}  campaignId
   * @param  {function} doesCampaignExistCB
   * @return {[boolean]} doesCampaignExist
   * @author Aswin Raj A
   */
  Campaign.doesCampaignExist = (campaignId, doesCampaignExistCB) => {
    Campaign.find({
      where: {
        and:[
          {"id": campaignId},
          {"lastRunAt": {neq: null}}
        ]
      }
    }, (campaignErr, campaigns) => {
      if(campaignErr){
        logger.error("Error while finding campaign", {
            user: ctx.req.accessToken.userId,
            error: campaignErr,
            stack: campaignErr ? campaignErr.stack : ""
        });
        const errorMessage = errorMessages.SERVER_ERROR;
        doesCampaignExistCB(errorMessage);
      }
      if(lodash.isEmpty(campaigns)){
        return doesCampaignExistCB(null, false);
      }
      return doesCampaignExistCB(null, true);
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
        and:[
          {"createdBy": ctx.req.accessToken.userId},
          {"lastRunAt": {neq: null}}
        ]
      },
      order: "lastRunAt DESC",
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
            let roundOpenRate = Math.round(parseFloat(openedRate)*
            hundredPercent)/hundredPercent;
            campaignMetricObj.percentage = roundOpenRate || "0";
            campaignMetricObj.count = campaignMetricsData.opened || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "UNOPENED":
          let unOpenedRate = hundredPercent - (campaignMetricsData.opened /
            (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
          ) * hundredPercent;
          let roundUnopened = Math.round(parseFloat(unOpenedRate)*
          hundredPercent)/hundredPercent;
            campaignMetricObj.title = "unopened";
            campaignMetricObj.percentage = roundUnopened || "0";
            campaignMetricObj.count =
              (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
              - campaignMetricsData.opened || "0";
            campaignMetricObj.class = "blue";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "CLICKED":
            campaignMetricObj.title = "clicked";
            let clickRate = (totalLinks < emptycount) ? "0" :
            (campaignMetricsData.clicked / totalLinks) * hundredPercent;
            let roundClickRate = Math.round(parseFloat(clickRate)*
            hundredPercent)/hundredPercent;
            campaignMetricObj.percentage = roundClickRate || "0";
            campaignMetricObj.count = campaignMetricsData.clicked || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "3";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "ACTIONABLE RESPONSES":
            campaignMetricObj.title = "actionable responses";
            campaignMetricObj.percentage = "1";
            campaignMetricObj.count = "1";
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
        and:[
          {"createdBy": ctx.req.accessToken.userId},
          {"lastRunAt": {neq: null}}
        ]
      },
      order: "lastRunAt DESC",
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

  /**
   * Get Campaignsfrom List of Campaign Ids
   * @param  {[Number]} campaignId  List of Campaign Ids
   * @param  {Function} callback
   * @return {[Campaign]} List of Campaign Objects
   * @author Syed Sulaiman M
   */
  Campaign.getCampaigns = (campaignIds, callback) => {
    Campaign.find({
      where: {
        id: {
          inq: campaignIds
        }
      }
    }, (campaignsErr, campaigns) => {
      callback(campaignsErr, campaigns);
    });
  };

  Campaign.remoteMethod(
    "campaignReport",
    {
      description: "Get Campaign Report",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number", required: true, http: {source: "path"}}
      ],
      returns: {arg: "campaignReport", type: "object", root: true},
      http: {verb: "get", path: "/:id/campaignReport"}
    }
  );

  /**
   * Get the Campaign Report for the given Campaign Id
   *
   * @param  {Context} ctx Context object to get accessToken
   * @param  {Number} id [campaign id]
   * @param  {function} callback
   * @return {Object} Capaign Report
   * @author Syed Sulaiman M
   */
  Campaign.campaignReport = (ctx, id, callback) => {
    let campaignReport = {
      sentEmails: 0,
      warmResponses: 0,
      deliveredEmails: 0,
      followUpsSent: 0
    };
    Campaign.findById(id, (campaignErr, campaign) => {
      if(campaignErr) {
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if(!campaign) {
        const errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
        return callback(errorMessage);
      }
      Campaign.app.models.campaignMetric.getMetricByCampaignId(campaign.id,
          (metricErr, metric) => {
        if(metricErr) {
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        if(metric) {
          campaignReport.sentEmails = metric.sentEmails;
          campaignReport.deliveredEmails = metric.sentEmails - metric.bounced;
        }
        return callback(null, campaignReport);
      });
    });
  };

  Campaign.remoteMethod(
    "recentCampaignReport",
    {
      description: "Get Campaign Report",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}}
      ],
      returns: {arg: "campaignReport", type: "object", root: true},
      http: {verb: "get", path: "/recentCampaignReport"}
    }
  );

  /**
   * Get the Campaign Report for the given Campaign Id
   *
   * @param  {Context} ctx Context object to get accessToken
   * @param  {Number} id [campaign id]
   * @param  {function} callback
   * @return {Object} Capaign Report
   * @author Syed Sulaiman M
   */
  Campaign.recentCampaignReport = (ctx, callback) => {
    let campaignReport = {
      sentEmails: 0,
      warmResponses: 0,
      deliveredEmails: 0,
      followUpsSent: 0
    };
    Campaign.find({
     where: {
       and:[
         {"createdBy": ctx.req.accessToken.userId},
         {"lastRunAt": {neq: null}}
       ]
     },
     order: "lastRunAt DESC",
     limit: 1
   }, (campaignErr, campaigns) => {
      if(campaignErr) {
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if(lodash.isEmpty(campaigns)) {
        const errorMessage = errorMessages.CAMPAIGN_NOT_FOUND;
        return callback(errorMessage);
      }
      Campaign.app.models.campaignMetric.getMetricByCampaignId(campaigns[0].id,
          (metricErr, metric) => {
        if(metricErr) {
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        if(metric) {
          campaignReport.sentEmails = metric.sentEmails;
          campaignReport.deliveredEmails = metric.sentEmails - metric.bounced;
        }
        return callback(null, campaignReport);
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
