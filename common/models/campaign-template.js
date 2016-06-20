"use strict";

import logger from "../../server/log";
import async from "async";
import Spamd from "node-spamd";
import lodash from "lodash";
import _ from "underscore";


module.exports = function(CampaignTemplate) {

  CampaignTemplate.remoteMethod(
    "checkSpam", {
      description: "Checks and returns whether contents is spam or not.",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "contents",
        type: "object",
        required: true,
        http: {
          source: "body"
        }
      }],
      returns: {
        arg: "additionalField",
        type: "object",
        root: true
      },
      http: {
        verb: "post",
        path: "/checkSpam"
      }
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
          mailsAsyncCB(err);
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
   *
   * @param  {[campaign]} campaign       [current campign object]
   * @param  {[person]} person           [current person for that campign]
   * @param  {[fucntion]} saveEmailCB    [callback]
   * @return {[CampaignTemplate]}        [person's email Template ]
   * @author Ramanavel Selvaraju
   */
  CampaignTemplate.getPersonTemplate = (campaign, person,
    getPersonTemplateCB) => {

    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personId: person.id
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
    getCommonTemplatesCB) => {

    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personId: null
        }, {
          missingTagIds: null
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
          input: {
            campign: campign,
            person: person
          }
        });
        return getCommonTemplatesCB(error);
      }
      if(tempalate.usedTagIds) {
        let one = 1;
        let randomIndex = lodash.random(campaignTemplates.length - one);
        let tempalate = campaignTemplates[randomIndex];

        let tagIdsArray = _.pluck(additionalValues, "fieldId");
        let personTagIds = lodash.sortedUniq(tagIdsArray);
        let usedTagIds = lodash.split(tempalate.usedTagIds, "|");
        let missingTagIds = lodash.difference(usedTagIds, personTagIds);
        return getCommonTemplatesCB(null, tempalate,
          lodash.join(missingTagIds, "|"));
      }
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
    missingTagIds, getAlternateTemplateCB) => {

    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personId: null
        }, {
          missingTagIds: missingTagIds
        }]
      }
    }, function(campaignTemplatesErr, campaignTemplates) {

      if (campaignTemplatesErr) {
        logger.error("Error Occured on getAlternateTemplate", {
          campaign: campaign,
          person: person,
          error: campaignTemplatesErr
        });
        return getAlternateTemplateCB(campaignTemplatesErr);
      }

      if (lodash.isEmpty(campaignTemplates)) {
        let error = new Error();
        error.message = "getAlternateTemplate: Template not found for the user";
        error.name = "alternateTemplateNotFound";
        logger.error({
          error: error,
          input: {
            campign: campign,
            person: person,
            additionalValues: additionalValues,
            missingTagIds: missingTagIds
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
  CampaignTemplate.personalize = (template, fieldValues) => {
    let spanTags = template.match(/<span class=("|')(tag)(.*?)(<\/span>)/g);
    async.eachSeries(spanTags, (spanTag, spanTagsCB) => {
      let spanDataId = spanTag.match(/data-id="(\d*)"/g);
      let fieldId = spanDataId[0].split(/"/)[1];
      let fieldValue = lodash.find(headers,
                                  lodash.matchesProperty("fieldId", fieldId));
      if(fieldValue) {
        template = tempalate.replace(spanTag, fieldValue.value);
        spanTagsCB(null);
      }
      let error = new Error();
      error.message = `Tag id: ${fieldId} not found in fieldvalues :
                                                                ${fieldValues}`;
      error.name = "smartTagNotFound";
      spanTagsCB(error);
    }, (spanTagsErr) => {
      logger.error("Error on CampaignTemplate.personalize",
                                                        {error: spanTagsErr});
      return {error: spanTagsErr, template: template};
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
