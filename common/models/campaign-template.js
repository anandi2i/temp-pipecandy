"use strict";

import logger from "../../server/log";
import async from "async";
import Spamd from "node-spamd";
import lodash from "lodash";
import _ from "underscore";
import request from "request";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(CampaignTemplate) {

  /**
   * Gets the campagin's common template and followups in a parallel manner
   * @param  {[Campaign]} campaign
   * @param  {[NULL]} reqparams         [null for this case]
   * @param  {[function]} getTemplateDataCB [callback]
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.getTemplatesAndStepNo = (campaign, reqparams,
    getTemplateDataCB) => {
    async.parallel({
      tempaltes: getAllCommonTemplates.bind(null, campaign.id),
      stepNoMap: CampaignTemplate.app.models.followUp.getFollowupStepNo.bind(
                      null, campaign.id)
    }, (parallelErr, results) => {
      if(parallelErr) {
        logger.error({error: parallelErr, stack: parallelErr.stack,
                      input: {campaign: campaign}});
        return getTemplateDataCB(parallelErr);
      }
      return getTemplateDataCB(parallelErr,
                             campaign, results.tempaltes, results.stepNoMap);
    });
  };

  /**
   * Get all the common templates used in a campaign
   * @param  {[number]} campaignId
   * @param  {[function]} getAllCommonTemplatesCB [callback]
   * @author Ramanavel Selvaraju
   */
  const getAllCommonTemplates = (campaignId,
            getAllCommonTemplatesCB) => {
    CampaignTemplate.find({
      where: {and: [{campaignId: campaignId}, {personId: null},
                    {missingTagIds: null}]
              }
    }, (templateFindErr, campaignTemplates) => {
      if(templateFindErr) {
        logger.error({error: templateFindErr, stack: templateFindErr.stack,
                      input: {campaignId: campaignId}});
        return getAllCommonTemplatesCB(templateFindErr);
      }
      if (lodash.isEmpty(campaignTemplates)) {
        return getAllCommonTemplatesCB(errorMessages.TEMPLATES_NOT_FOUND);
      }
      return getAllCommonTemplatesCB(null, campaignTemplates);
    });
  };

  /**
   * prepares the api model for preview methods
   * @param  {[Campaign]} campaign
   * @param  {[CampaignTemplate]} templates
   * @param  {[JSON]} stepNoMap
   * @param  {[Function]} previewResponseCB [callback]
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.preparePreviewResponse = (campaign, templates, stepNoMap,
      previewResponseCB) => {
    let response = [];
    lodash(templates).forEach(function(template) {
      if(template.followUpId) {
        template.stepNo = stepNoMap[template.followUpId];
      }
      response.push(template);
    });
    return previewResponseCB(null, {campaign: campaign, templates: response});
  };

  CampaignTemplate.remoteMethod(
    "wordAI", {
      description: "Returns multiple combinatiosnof an email contents.",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}},
                {arg: "template", type: "object", required: true,
                  http: {source: "body"}}],
      returns: {arg: "content", type: "object", root: true},
      http: {verb: "post", path: "/wordAI"}
    }
  );

  /**
   * Integrates the WordAi api to generate the multiple combinations of
   * an Email Templates
   * Input:
   * {"content": "Here is an example content"}
   *
   * @param  {[Context]} ctx
   * @param  {[CampaignTemplate]} template
   * @param  {[type]} wordAICB
   * @return {[Object]} response.body
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.wordAI = (ctx, template, wordAICB) => {
    let options = {
      method: "POST",
      url: "http://wordai.com/users/turing-api.php",
      headers: {
     "cache-control": "no-cache",
     "content-type": "multipart/form-data; boundary=---011000010111000001101001"
      },
      formData: {
        s: template.content, quality: "Readable", email: "ashwin@pipecandy.com",
        pass: "ashwin0302", output: "json", nooriginal: "on",
        sentence: "on", paragraph: "on"
      }
    };

    request(options, (wordAIErr, response, body) => {
      if (wordAIErr) {
        logger.error({error: wordAIErr, template: template});
        return wordAICB(wordAIErr);
      };
      return wordAICB(null, JSON.parse(body));
    });
  };

  CampaignTemplate.remoteMethod(
    "checkSpam", {
      description: "Checks and returns whether contents is spam or not.",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}},
                {arg: "contents", type: "object", required: true,
                 http: {source: "body"}
               }],
      returns: {arg: "additionalField", type: "object", root: true},
      http: {verb: "post", path: "/checkSpam"}
    }
  );
  /**
   * Integrated with spamassassin using node-spamd npm
   * Sample Input:
   * [{
   * "subject": "test",
   * "body": "This is a test message."
   * }, {
   * "subject": "Viagra, Cialis, Vicodin: buy medicines without prescription! CHEAPEST PRICE!",
   * "body": "Cheap prices on viagra, cialis, vicodin! FPA approved! High quality is guaranteed!  Get your medicine without prescription, online! Loose weight, gain strenght.    Word at home and get a lot of money! See it for yourself!  This message is not a spam.  Take a look at my pictures! Your forgot it on my cellphone.  <a href=\"http://moxpage.info/get-paid-taking-surveys.html\">Visit your Yahoo Group now</a>"
   *
   * }]
   * @param  {[context]} ctx
   * @param  {[List[String]]} mails
   * @param  {[function]} checkSpamCB
   * @return {List[spamcResult]}
   */
  CampaignTemplate.checkSpam = (ctx, mails, checkSpamCB) => {
    let response = [];
    const spamAssassinPort = 783;
    async.eachSeries(mails, (mail, mailsAsyncCB) => {
      let spamd = new Spamd("from@yourdomain.com", "to@anotherdomain.com",
                                                 "localhost", spamAssassinPort);
      spamd.evaluate(mail.subject, mail.body, function(result, err) {
        if(err){
          return mailsAsyncCB(err);
        }
        response.push({mail: mail, spamResult: result});
        mailsAsyncCB(null);
      });
    }, (mailsAsyncErr) => {
      return checkSpamCB(mailsAsyncErr, response);
    });
  };

//npm run calls
  /**
   * gets peronalized templates for the current campaign using personId
   * If its selecting template for a folloup means that will pass followupId
   * else the followupId will be null
   *
   * @param  {[campaign]} campaign       [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[fucntion]} saveEmailCB    [callback]
   * @return {[CampaignTemplate]}        [person's email Template ]
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.getPersonTemplate = (campaign, person,
    followup, getPersonTemplateCB) => {

    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personId: person.id
        }, {
          followUpId: followup ? followup.id : null
        }]
      }
    }, function(campaignTemplatesErr, campaignTemplates) {

      if (campaignTemplatesErr) {
        logger.error("Error Occured on campaignTemplates", {
          campaign: campaign,
          person: person,
          error: campaignTemplatesErr
        });
        return getPersonTemplateCB(campaignTemplatesErr);
      }

      if (lodash.isEmpty(campaignTemplates)) {
        logger.info("campaignTemplates is empty for the Object : ", {
          campaign: campaign,
          person: person
        });
        return getPersonTemplateCB(null);
      }
      return getPersonTemplateCB(null, campaignTemplates[0]);
    });
  };

  /**
   * gets common templates for the current campaign using personId
   * common template will have multiple templates we have to
   * choose it by random among them.
   *
   * @param  {[campaign]} campaign       [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[fucntion]} saveEmailCB    [callback]
   * @return {[CampaignTemplate]}        [person's email Template ]
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.getCommonTemplates = (campaign, person, additionalValues,
    followup, getCommonTemplatesCB) => {

    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personId: null
        }, {
          missingTagIds: null
        }, {
          followUpId: followup ? followup.id : null
        }]
      }
    }, (getCommonTemplateErr, campaignTemplates) => {
      if (getCommonTemplateErr) {
        return getCommonTemplatesCB(getCommonTemplateErr);
      }
      if (lodash.isEmpty(campaignTemplates)) {
        let error = new Error();
        error.message = "Common Template is empty";
        error.name = "templateNotFound";
        logger.error({
          error: error,
          stack: error.stack,
          input: {campign: campaign, person: person,
            additionalValues: additionalValues, followup: followup
          }
        });
        return getCommonTemplatesCB(error);
      }
      //selecting the template logic
      let one = 1;
      let randomIndex = lodash.random(campaignTemplates.length - one);
      let tempalate = campaignTemplates[randomIndex];
      //checks whether common template is fit for the prospect or not
      if(tempalate.usedTagIds) {
        try{
          let tagIdsArray = _.pluck(additionalValues, "fieldId");
          let personTagIds = lodash.sortedUniq(tagIdsArray);
          let usedTagIds =
          lodash.map(lodash.split(tempalate.usedTagIds, "|"), lodash.parseInt);
          let missingTagIds = lodash.difference(usedTagIds, personTagIds);
          return getCommonTemplatesCB(null, tempalate,
            lodash.join(missingTagIds, "|"));
        } catch (chooseCommonTempErr) {
          logger.error({
            error: chooseCommonTempErr,
            stack: chooseCommonTempErr.stack,
            input: {campign: campaign, person: person,
              additionalValues: additionalValues, followup: followup
            }
          });
          return getCommonTemplatesCB(chooseCommonTempErr);
        } //catch
      } //if(tempalate.usedTagIds)

      return getCommonTemplatesCB(null, tempalate);
    });
  };

  /**
   * gets alternate templates for the current campaign using personId
   * Smart tags will not be common for all the lists. Inorder to avoid the
   * error we are going to missing tagis templates.
   *
   * @param  {[campaign]} campaign       [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[fucntion]} saveEmailCB    [callback]
   * @return {[CampaignTemplate]}        [person's email Template ]
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.getAlternateTemplate = (campaign, person, additionalValues,
    missingTagIds, followup, getAlternateTemplateCB) => {
    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personId: null
        }, {
          missingTagIds: missingTagIds
        }, {
          followUpId: followup ? followup.id : null
        }]
      }
    }, (campaignTemplatesErr, campaignTemplates) => {

      if (campaignTemplatesErr) {
        logger.error("Error Occured on getAlternateTemplate", {
          stack: campaignTemplatesErr.stack,
          error: campaignTemplatesErr,
          input: {
            campign: campaign, person: person, followup: followup,
            additionalValues: additionalValues, missingTagIds: missingTagIds
          }
        });
        return getAlternateTemplateCB(campaignTemplatesErr);
      }

      if (lodash.isEmpty(campaignTemplates)) {
        let error = new Error();
        error.message = "getAlternateTemplate: Template not found for the user";
        error.name = "alternateTemplateNotFound";
        logger.error({
          error: error,
          stack: error.stack,
          input: {
            campign: campaign, person: person, followup: followup,
            additionalValues: additionalValues, missingTagIds: missingTagIds
          }
        });
        return getAlternateTemplateCB(error);
      }
      return getAlternateTemplateCB(null, campaignTemplates[0]);
    });
  };

  /**
   * Personalize the template for each person with field values
   * Basically its applies the smart tags with in the email temaplates
   *
   * @param  {[CampaignTemplate]} template
   * @param  {List[additionalFieldValue]} fieldValues
   * @return {error: spanTagsErr, template: template}
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.personalize = (template, fieldValues, personalizeCB) => {
    try {
      let spanTags = template.match(/<span class=("|')(tag)(.*?)(<\/span>)/g);
      async.eachSeries(spanTags, (spanTag, spanTagsCB) => {
        let spanDataId = spanTag.match(/data-id=("|')(\d*)("|')/g);
        spanDataId = lodash.replace(spanDataId, /(')/g, "\"");
        let fieldId = spanDataId.split(/"/)[1];
        let fieldValue = lodash.find(fieldValues,
                  lodash.matchesProperty("fieldId", lodash.toInteger(fieldId)));
        if(fieldValue) {
          template = lodash.replace(template, spanTag, fieldValue.value);
          spanTagsCB(null);
        } else {
          let error = new Error();
          error.message = `Tag id: ${fieldId} not found in fieldvalues`;
          error.name = "smartTagNotFound";
          logger.error({error: error, stack: error.stack,
                        input: {fieldValues: fieldValues}});
          return spanTagsCB(error);
        }
      }, (spanTagsErr) => {
        if(spanTagsErr){
          logger.error("Error on CampaignTemplate.personalize",
                                                          {error: spanTagsErr});
        }
        return personalizeCB(spanTagsErr, template);
      });
    } catch(personalizeCatchErr) {
      logger.error({
        error: personalizeCatchErr,
        stack: personalizeCatchErr.stack,
        input: {template: template, fieldValues: fieldValues}
      });
      return personalizeCB(personalizeCatchErr);
    }

  };

  /**
   * Delete the campaignTemplates when the campaign updates
   * - from destroyCampaignElements process
   * @param  {[campaign]} campaign
   * @param  {[function]} destroyByCampaignCB
   * @author Ramanavel
   */
  CampaignTemplate.destroyByCampaign = (campaign, destroyByCampaignCB) => {
    campaign.campaignTemplates.destroyAll((campaignTemplatesDestroyErr) => {
      if(campaignTemplatesDestroyErr){
        return destroyByCampaignCB("Error while destroying campaignTemplates\
         for campaign: ", campaignTemplatesDestroyErr);
      }
      return destroyByCampaignCB(null, "Deleted successfully!");
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
  CampaignTemplate.saveTemplates = (campaign, campaignTemplates,
    saveTemplatesCB) => {
    campaign.campaignTemplates.create(campaignTemplates,
      (campaignTemplatesCreateErr, persistedCampaignTemplates) => {
        if(campaignTemplatesCreateErr) {
          logger.error("Error on saving CampaignTemplates : ", {
              campaign: campaign,
              campaignTemplates: campaignTemplates,
              error: campaignTemplatesCreateErr,
              stack: campaignTemplatesCreateErr.stack
            });
            return saveTemplatesCB(campaignTemplatesCreateErr);
        }
        return saveTemplatesCB(campaignTemplatesCreateErr,
          persistedCampaignTemplates);
    });
  };

//observers
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  CampaignTemplate.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

};
