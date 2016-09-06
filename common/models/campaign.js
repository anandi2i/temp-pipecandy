"use strict";

import logger from "../../server/log";
import async from "async";
import constants from "../../server/utils/constants";
import dateUtil from "../../server/utils/dateUtil";
import {XmlEntities as entities} from "html-entities";
import lodash from "lodash";
import moment from "moment-timezone";
import campaignMetricArray from "../../server/utils/campaign-metric-fields";
import statusCodes from "../../server/utils/status-codes";
import validator from "../../server/utils/validatorUtility";
import queueUtil from "../../server/emailReader/mailEnqueue";
import app from "../../server/server.js";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import striptags from "striptags";
import uuid from "node-uuid";
import google from "googleapis";
const gmailClass = google.gmail("v1");
import googleTokenHandler from "../../server/utils/googleTokenHandler";
import googleAuth from "google-auth-library";
const auth = new googleAuth();

//const systemTimeZone = moment().format("Z");
const serverUrl = app.get("appUrl");

module.exports = function(Campaign) {

  Campaign.afterRemote("findById", function(context, data, next) {
    let campaign = context.result;
    const parentId = campaign.parentId ? campaign.parentId : campaign.id;
    getRunTemplate(parentId, (err, template) => {
      if(err) return next(errorMessages.SERVER_ERROR);
      campaign.template = template;
      return next();
    });
  });

  Campaign.remoteMethod(
    "newRun", {
      description: "Returns all the mail templates used in the campaign",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}},
                {arg: "campaignId", type: "number", http: {source: "path"}}],
      returns: {arg: "campaign", type: "object", root: true},
      http: {verb: "put", path: "/:campaignId/newRun"}
    }
  );

  /**
   * API to create a new Campaign run for the parent campaign
   * Campaign name will be generated based on the previous runs
   * @param  {[object]} ctx
   * @param  {[number]} campaignId
   * @param  {[function]} newRunCb
   * @return {[object]} runCampaign
   * @author Aswin Raj A
   */
  Campaign.newRun = (ctx, campaignId, newRunCb) => {
    async.waterfall([
      async.apply(getCurrentCampaign, campaignId, ctx.req.accessToken.userId),
      setReferrerCampaign,
      (campaign, userId, parentCampaign, referrerId, passParamsCB) => {
        getRunCampaigns(parentCampaign.id, (err, runCampaigns) => {
          if(err) return passParamsCB(err);
          return passParamsCB(null, campaign, runCampaigns, userId,
            parentCampaign, referrerId);
        });
      },
      createRunCampaign
    ], (asyncErr, runCampaign) => {
      return newRunCb(asyncErr, runCampaign);
    });
  };

  /**
   * Method to get the campaign for the given campaignId and for the
   * current user
   * @param  {[number]} campaignId
   * @param  {[number]} userId
   * @param  {[function]} getCampaignCB
   * @return {[object]} campaign
   * @author Aswin Raj A
   */
  const getCurrentCampaign = (campaignId, userId, getCampaignCB) => {
    Campaign.find({
      where: {and: [{id: campaignId}, {createdBy: userId}]}
    }, (campaignFindErr, campaigns) => {
      if(campaignFindErr) {
        logger.error("Error while finding campaign", {
          input: {campaignId: campaignId},
          error: campaignFindErr, stack: campaignFindErr.stack});
        return getCampaignCB(errorMessages.SERVER_ERROR);
      }
      if(lodash.isEmpty(campaigns)) {
        logger.error("There is no campaign for campaignId", {
          input: {campaignId: campaignId},
          error: errorMessages.INVALID_CAMPAIGN_ID});
        return getCampaignCB(errorMessages.INVALID_CAMPAIGN_ID);
      }
      return getCampaignCB(null, campaigns[0], userId);
    });
  };

  /**
   * Method to set the referrer for the current campaign if the campaign is not
   * a parent campaign.
   * If the current campaign is a run campaign, then the referrerId will be the
   * current campaign's Id and parent Id will be the run campaign's parent id
   * If the current campaign is a parent campaign, then both referrer and
   * parent id will be the current campaigns id
   * @param  {[type]} campaign      [description]
   * @param  {[type]} userId        [description]
   * @param  {[type]} getCampaignCB [description]
   * @return {[type]}               [description]
   * @author Aswin Raj A
   */
  const setReferrerCampaign = (campaign, userId, getCampaignCB) => {
    const parentId = campaign.parentId ? campaign.parentId : campaign.id;
    const referrerId = campaign.id;
    getCurrentCampaign(parentId, userId, (err, parentCampaign, userId) => {
      return getCampaignCB(err, campaign, userId, parentCampaign, referrerId);
    });
  };

  /**
   * Method to get all the runs for the current campaign if there are any.
   * @param  {[object]} campaign
   * @param  {[function]} getRunCampaignsCB
   * @return {[object]} campaign, runCampaigns
   * @author Aswin Raj A
   */
  const getRunCampaigns = (parentId, getRunCampaignsCB) => {
    Campaign.find({
      where: {parentId: parentId},
      order: "createdAt DESC"
    }, (campaignFindErr, runCampaigns) => {
        if(campaignFindErr) {
          logger.error("Error while finding run campaigns", {
            input: {campaignId: parentId},
            error: campaignFindErr, stack: campaignFindErr.stack});
          return getRunCampaignsCB(errorMessages.SERVER_ERROR);
        }
        return getRunCampaignsCB(null, runCampaigns);
    });
  };

  /**
   * Create the new run campaign for the current campaign
   * run campaign will be created based on the previous runs
   * @param  {[object]} campaign
   * @param  {[object]} runCampaigns
   * @param  {[function]} createCampaignCB
   * @return {[object]} campaign
   * @author Aswin Raj A
   */
  const createRunCampaign = (campaign, runCampaigns, userId, parentCampaign,
    referrerId, createCampaignCB) => {
    const runName = `Run ${runCampaigns.length+constants.ONE}`+
      ` - ${parentCampaign.name}`;
    let runCampaignObj = {
      name: runName,
      parentId: parentCampaign.id,
      referrerId: referrerId,
      createdBy: userId
    };
    createCampaign(runCampaignObj, (err, campaign) => {
      return createCampaignCB(err, campaign);
    });
  };

  /**
   * Create a new campaign with the campaign object
   * @param  {[object]} campaignObj
   * @param  {[function]} createCampaignCB
   * @return {[object]} campaign
   * @author Aswin Raj A
   */
  const createCampaign = (campaignObj, createCampaignCB) => {
    Campaign.create(campaignObj, (campaignCreateErr, campaign) => {
      if(campaignCreateErr) {
        logger.error("Error while creating run campaign", {
          input: {campaignId: campaign.id, runName: runName},
          error: campaignCreateErr, stack: campaignCreateErr.stack});
        return createCampaignCB(errorMessages.SERVER_ERROR);
      }
      return createCampaignCB(null, campaign);
    });
  };

  /**
   * Method to get the template for the current run
   * @param  {[number]} campaignId
   * @param  {[function]} getTemplateCB
   * @return {[object]} template
   * @author Aswin Raj A
   */
  const getRunTemplate = (campaignId, getTemplateCB) => {
    Campaign.app.models.campaignTemplate.find({
      where : {and: [{campaignId: campaignId}, {personId: null}]}
    }, (templateFindErr, templates) => {
      if(templateFindErr) {
        logger.error("Error while finding campaign templates", {
          input: {campaignId: campaignId},
          error: templateFindErr, stack: templateFindErr.stack});
        return getTemplateCB(templateFindErr);
      }
      return getTemplateCB(null, templates[0]);
    });
  };

  Campaign.remoteMethod(
    "previewCampaignTemplate", {
      description: "Returns all the mail templates used in the campaign",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}},
                {arg: "id", type: "number", http: {source: "path"}}],
      returns: {arg: "CampaignTemplate", type: "campaignTemplate", root: true},
      http: {verb: "get",
             path: "/:id/campaignTemplates/preview"}
    }
  );

  Campaign.previewCampaignTemplate = (ctx, id, previewCB) => {
    async.waterfall([
     async.apply(getCampaign, ctx, id, null),
     Campaign.app.models.campaignTemplate.getTemplatesAndStepNo,
     Campaign.app.models.campaignTemplate.preparePreviewResponse
   ], (asyncErr, response) => {
      if(asyncErr) {
        logger.error({error: asyncErr, stack: asyncErr.stack,
                      input: {userId: ctx.req.accessToken.userId,
                              campaignId: id}
                      });
        return previewCB(asyncErr.status ? asyncErr
                                         : errorMessages.SERVER_ERROR);
      }
      return previewCB(null, response);
    });
  };

  Campaign.remoteMethod(
    "testMail",
    {
      description: "API to send a test campaign",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {
        arg: "reqParams", type: "object", required: true, http: {source: "body"}
        }
      ],
      returns: {arg: "status", type: "campaign", root: true},
      http: {
        verb: "post", path: "/testMail"
      }
    }
  );

  /**
   * API to generate a test mail for the current campaign to the mentioned
   * email address
   * @param  {[object]} reqParams
   * @param  {[function]} testMailCB
   * @return {string} status
   * @author Aswin Raj A
   */
  Campaign.testMail = (ctx, reqParams, testMailCB) => {
    const {email, subject, content} = reqParams;
    let mailContent = {
      userDetails : {
        userId: ctx.req.accessToken.userId,
      },
      email: email,
      subject: subject,
      content: content
    };
    generateCredentials(mailContent.userDetails.userId,
      (err, userObj) => {
      if(err) testMailCB(err);
      const userCredential = userObj.credentials;
      const {accessToken, refreshToken} = userCredential;
      if(!accessToken && !refreshToken) {
        logger.error("Access or Refresh Token not available for User Id",
          mailContent.userDetails.userId);
        return testMailCB(errorMessages.SERVER_ERROR);
      }
      mailContent.fromEmail = userObj.profile.emails[0].value;
      mailContent.userDetails.displayName = userObj.profile.displayName;
      mailContent.credential = userCredential;
      async.waterfall([
        async.apply(validateTestMail, mailContent),
        buildEmail,
        sendEmail
      ], (asyncErr, result) => {
        if(asyncErr) return testMailCB(asyncErr);
        return testMailCB(null, result);
      });
    });
  };

  /**
   * Method to generate credentials for the current user
   * @param  {[number]} userId
   * @param  {[function]} generateCredentialsCB
   * @return {[object]} userObj
   * @author Aswin Raj A
   */
  const generateCredentials = (userId, generateCredentialsCB) => {
    Campaign.app.models.userIdentity.findByUserId(userId,
    (err, userObj) => {
      if(err) {
        logger.error("Error while finding credentials", {
          input: {userId: userId},
          error: err, stack: err.stack});
        return generateCredentialsCB(err);
      }
      return generateCredentialsCB(null, userObj[0]);
    });
  };

  /**
   * Validate the mail content before generating the mail
   * @param  {[object]} mailContent
   * @param  {[function]} validateCB
   * @return {[object]} mailContent
   * @author Aswin Raj A
   */
  const validateTestMail = (mailContent, validateCB) => {
    let {email, subject, content} = mailContent;
    email = email && email.trim();
    subject = subject && striptags(subject).trim();
    content = content && striptags(content).trim();
    if(!email) {
      return validateCB(errorMessages.EMPTY_EMAIL);
    } else if (!subject) {
      return validateCB(errorMessages.EMPTY_SUBJECT);
    } else if (!content) {
      return validateCB(errorMessages.BLANK_TEMPLATE_CONTENT);
    }
    validator.validateEmail(email, (isValid) => {
      if(isValid) {
        return validateCB(null, mailContent);
      }
      return validateCB(errorMessages.INVALID_EMAIL);
    });
  };

  /**
   * Method to build the email with the content provided
   * @param  {[object]} mailContent
   * @param  {[function]} buildEmailCB
   * @return {objects} base64EncodedEmail, oauth2Client, mailContent
   * @author Aswin Raj A
   */
  const buildEmail = (mailContent, buildEmailCB) => {
    const googleCredentials = app.get("googleCredentials").installed;
    const clientSecret = googleCredentials.client_secret;
    const clientId = googleCredentials.client_id;
    const redirectUrl = googleCredentials.redirect_uris[0];
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    const {accessToken, refreshToken} = mailContent.credential;
    oauth2Client.credentials.access_token = accessToken;
    oauth2Client.credentials.refresh_token = refreshToken;
    let emailLines = [];
    const subject = striptags(mailContent.subject).trim();
    emailLines.push(`From: ${mailContent.userDetails.displayName}
      <${mailContent.fromEmail}>`);
    emailLines.push(`To: <${mailContent.email}>`);
    emailLines.push("Content-type: text/html;charset=iso-8859-1");
    emailLines.push("MIME-Version: 1.0");
    emailLines.push(`Subject: ${subject}`);
    emailLines.push("");
    emailLines.push(mailContent.content);
    const email = emailLines.join("\r\n").trim();
    let base64EncodedEmail = new Buffer(email).toString("base64");
    base64EncodedEmail = base64EncodedEmail.replace(/\+/g, "-")
      .replace(/\//g, "_");
    return buildEmailCB(null, base64EncodedEmail, oauth2Client, mailContent);
  };

  /**
   * Method to send the base64EncodedEmail through gmail API
   * @param  {[object]} base64EncodedEmail
   * @param  {[object]} oauth2Client
   * @param  {[object]} mailContent
   * @param  {[function]} sendEmailCB
   * @return {[string]} user
   * @author Aswin Raj A
   */
  const sendEmail = (base64EncodedEmail, oauth2Client, mailContent,
    sendEmailCB) => {
    let resource = {
      raw: base64EncodedEmail
    };
    gmailClass.users.messages.send({
      auth: oauth2Client,
      userId: mailContent.fromEmail,
      resource: resource
    }, function(err, results) {
      if (err) {
        const invalidCode = 401;
        if (err.code === invalidCode) {
          regenerateAccessToken(mailContent.userDetails.userId, oauth2Client,
            (err, user) => {
            if(err) return sendEmailCB(errorMessages.SERVER_ERROR);
            const {accessToken, refreshToken} = user.credentials;
            oauth2Client.credentials.access_token = accessToken;
            oauth2Client.credentials.refresh_token = refreshToken;
            sendEmail(base64EncodedEmail, oauth2Client, mailContent,
              sendEmailCB);
          });
        } else {
          logger.error("Error while sending mail", {
            error: err, stack: err.stack});
          return sendEmailCB(errorMessages.SERVER_ERROR);
        }
      } else {
        return sendEmailCB(null, "Mail Sent");
      }
    });
  };

  /**
   * Incase accessToken fails for the user, we need to regenerate the accessToken
   * and update the credentials in userIdentity table
   * @param  {[number]} userId
   * @param  {[object]} oauth2Client
   * @param  {[function]} regenerateAccessTokenCB
   * @return {[object]} user
   * @author Aswin Raj A
   */
  const regenerateAccessToken = (userId, oauth2Client,
    regenerateAccessTokenCB) => {
    async.waterfall([
      async.apply(generateCredentials, userId),
      updateGoogleAccessToken,
      updateUserCredentials
    ], (asyncErr, user) => {
      if(asyncErr){
        return regenerateAccessTokenCB(asyncErr);
      }
      return regenerateAccessTokenCB(null, user);
    });
  };

  /**
   * Update the google access token while regenerating the access token
   * @param  {[object]} userIdentity
   * @param  {[function]} updateCB
   * @return {[object]} userIdentity
   * @author Aswin Raj A
   */
  const updateGoogleAccessToken = (userIdentity, updateCB) => {
    googleTokenHandler.updateAccessToken(userIdentity,
      (tokenHandlerErr, userIdentity) => {
      if(tokenHandlerErr) {
        logger.error("Error while updating accessToken", {
          input: {userId: userId},
          error: tokenHandlerErr, stack: tokenHandlerErr.stack});
        return updateCB(errorMessages.INVALID_ACCESS_TOKEN);
      }
      return updateCB(null, userIdentity);
    });
  };

  /**
   * Update the generated Google accessToken in the userIdenity table
   * @param  {[object]} userIdentity
   * @param  {[function]} updateCB
   * @return {[object]} user
   * @author Aswin Raj A
   */
  const updateUserCredentials = (userIdentity, updateCB) => {
    Campaign.app.models.userIdentity.updateCredentials(userIdentity,
    (userIdentityErr, user) => {
    if(userIdentityErr) {
      logger.error("Error while updating credentials", {
        input: {userId: userIdentity[0].userId},
        error: userIdentityErr,
        stack: userIdentityErr.stack});
      return updateCB(userIdentityErr);
    }
    return updateCB(null, user);
    });
  };


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
      (campaign, transit, passParamsCB) => {
        enqueueToMailAssembler(campaign, transit, (err, response) => {
          if(err) return passParamsCB(err);
          return passParamsCB(null, campaign, statusCodes.enqueued);
        });
      },
      Campaign.setStatus
    ], (asyncErr, result) => {
      if(asyncErr) {
        const errorArray = ["EMPTY_LIST", "TEMPLATE_NOT_FOUND",
          "EMPTY_SUBJECT"];
        if (lodash.includes(errorArray, asyncErr.name)) {
          return saveCampaignElementsCB(asyncErr);
        }
        return saveCampaignElementsCB(errorMessages.SERVER_ERROR);
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
   * @author Syed Sulaiman M,Naveen Kumar(Modified)
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
      const stoppedStatusCode = statusCodes.campaignStopped;
      const sentStatusCode = statusCodes.campaignSent;
      const executedStatusCode = statusCodes.campaignExecuted;
      if(campaign.statusCode === stoppedStatusCode) {
        return callback(null, campaign);
      }
      if(campaign.statusCode === executedStatusCode) {
        return callback(null, campaign);
      }
      let statusArray = [statusCodes["followUpResumed-1"],
        statusCodes["followUpResumed-2"],
        statusCodes["followUpResumed-3"],
        statusCodes["followUpResumed-4"],
        statusCodes["followUpResumed-5"],
        statusCodes["followUpResumed-6"],
        statusCodes["followUpResumed-7"],
        statusCodes["followUpResumed-8"],
        sentStatusCode];
      let containsCheck = lodash.includes(statusArray, campaign.statusCode);
      if(containsCheck) {
        stopFollowUps(campaign, (stopError, followUps) => {
          if(stopError) return callback(errorMessages.SERVER_ERROR);
          if(followUps.length === constants.EMPTYARRAY) {
            return callback(null, campaign);
          }
          let result = "followUpStopped-"
            + lodash.minBy(followUps, "stepNo").stepNo;
          if(!result) return callback(null, campaign);
          updateStatusProcess(campaign, statusCodes[result], (err, camp) => {
            if(err) return callback(errorMessages.SERVER_ERROR);
            return callback(null, campaign);
          });
        });
      } else {
        campaign.updateAttribute("statusCode", statusCodes.campaignStopped,
            (updateErr, updatedCampaign) => {
          if(updateErr) return callback(errorMessages.SERVER_ERROR);
          stopFollowUps(campaign, (stopError, followUps) => {
            if(stopError) return callback(errorMessages.SERVER_ERROR);
            return callback(null, campaign);
          });
        });
      }
    });
  };

  /**
   * Method to Stop FollowUps in a Campaign
   * @param  {Campaign}   campaign
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  const stopFollowUps = (campaign, callback) => {
    const stoppedStatusCode = statusCodes.followUpStopped;
    async.autoInject({
      followUps: [async.apply(getFollowUpsToBeStopped, campaign)],
      updateFollowUps: (followUps, callback) => {
        Campaign.app.models.followUp.updateFollowUpsStatus(followUps,
            stoppedStatusCode, (err, updatedFollowUps) => {
          callback(err, updatedFollowUps);
        });
      }
    }, (error, results) => {
      if(error){
        return callback(error);
      }
      return callback(null, results.updateFollowUps);
    });
  };

  /**
   * Method to Get FollowUps for a Campaign
   * @param  {Campaign}   campaign
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  const getFollowUpsToBeStopped = (campaign, callback) => {
    const stoppedStatusCode = statusCodes.followUpStopped;
    const sentStatusCode = statusCodes.followUpSent;
    Campaign.app.models.followUp.getFollowUpsCampaignId(campaign.id,
        (followUpsErr, followUps) => {
      if(followUpsErr) {
        logger.error("Error while getting Follow Ups for Campaign", {
          error: followUpsErr, stack: followUpsErr.stack, input:
          {campaignId: campaign.id}});
        return callback(err);
      }
      followUps = lodash.filter(followUps, (o) => {
        return o.statusCode !== stoppedStatusCode
          && o.statusCode !== sentStatusCode;
      });
      return callback(null, followUps);
    });
  };

  Campaign.remoteMethod(
    "resume",
    {
      description: "To Resume the campaign",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number", required: true,
          http: {source: "path"}}
      ],
      returns: {arg: "campaign", type: "campaign", root: true},
      http: {verb: "put", path: "/:id/resume"}
    }
  );

  /**
   * API to resume the campaign
   * if the campaign is resumed after its scheduled date, campaign will be
   * assembled and sent with the current time
   * if the campaign is resumed before its scheduled date, campaign will be
   * updated from isStopped true to false and it will be assembled and
   * scheduled again
   * @param  {Context} ctx [Context object to get accessToken]
   * @param  {number} campaignId [campaign id]
   * @param  {Function} resumeCB
   * @return {Campaign} [Persisted Campaign Object]
   * @author Aswin Raj A,Naveen Kumar(Modified)
   */
  Campaign.resume = (ctx, id, resumeCB) => {
    getCampaign(ctx, id, null, (err, campaign) => {
      if(err) {
        return resumeCB(err);
      }
      if(!campaign) {
        const errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
        return resumeCB(errorMessage);
      }
      let statusArray = [statusCodes["followUpStopped-1"],
        statusCodes["followUpStopped-2"],
        statusCodes["followUpStopped-3"],
        statusCodes["followUpStopped-4"],
        statusCodes["followUpStopped-5"],
        statusCodes["followUpStopped-6"],
        statusCodes["followUpStopped-7"],
        statusCodes["followUpStopped-8"],
        statusCodes.campaignSent];
      let containsCheck = lodash.includes(statusArray, campaign.statusCode);
      if(containsCheck) {
        resumeFollowUps(campaign, (err, response) => {
          if(err) {
            logger.error("Error while resuming campaign followUps",
            {error: err, stack: err.stack, input:{campaignId:id}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return resumeCB(errorMessage);
          }
          return resumeCB(null, response);
        });
      } else {
        resumeCampaign(campaign, (err, response) => {
          if(err) {
            logger.error("Error while resuming campaign",
            {error: err, stack: err.stack, input:{campaignId:id}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return resumeCB(errorMessage);
          }
          return resumeCB(null, response);
        });
      }
    });
  };

  /**
   * Method to Resume Campaign
   * @param  {Campaign}   campaign
   * @param  {Function} callback
   * @author Aswin Raj A, Syed Sulaiman M(modified)
   */
  const resumeCampaign = (campaign, callback) => {
    const resumeStatusCode = statusCodes.campaignResumed;
    async.waterfall([
      async.apply(validateStatusCode, campaign),
      enqueueToMailAssembler,
      (response, passParamsCB) => {
        passParamsCB(null, campaign);
      },
      Campaign.app.models.followUp.reScheduleFollowUps,
      (response, passParamsCB) => {
        passParamsCB(null, campaign, resumeStatusCode);
      },
      updateStatusProcess
    ], (asyncErr, result) => {
      if(asyncErr){
        callback(asyncErr);
      }
      callback(null, campaign);
    });
  };

  /**
   * Method to Resume FollowUps in a Campaign
   * @param  {Campaign}   campaign
   * @param  {Function} callback
   * @author Syed Sulaiman M, Naveen Kumar(modified)
   */
  const resumeFollowUps = (campaign, callback) => {
    async.waterfall([
      async.apply(getStoppedFollowUpsForCampaign, campaign),
      scheduleFollowUps
    ], (asyncErr, followUps) => {
      if(asyncErr) return callback(asyncErr);
      if(followUps.length === constants.EMPTYARRAY) {
        return callback(null, campaign);
      }
      let result = "followUpResumed-" +
        lodash.minBy(followUps, "stepNo").stepNo;
      if(!result) return callback(null, campaign);
      updateStatusProcess(campaign, statusCodes[result], (err, camp) => {
        if(err) return callback(errorMessages.SERVER_ERROR);
        return callback(null, campaign);
      });
    });
  };

  const validateStatusCode = (campaign, validateStatusCodeCB) => {
    if(campaign.statusCode === statusCodes.campaignStopped) {
      return validateStatusCodeCB(null, campaign, "resumed");
    }
    return validateStatusCodeCB("Invalid previous status code");
  };

  /**
   * Method to Get Stopped FollowUps for a Campaign
   * @param  {Campaign}   campaign
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  const getStoppedFollowUpsForCampaign = (campaign, callback) => {
    const stoppedStatusCode = statusCodes.followUpStopped;
    Campaign.app.models.followUp.getFollowUpsByStatusAndCampaignId(campaign.id,
        stoppedStatusCode, (followUpsErr, followUps) => {
      if(followUpsErr) {
        logger.error("Error while getting Follow Ups for Campaign", {
          error: followUpsErr, stack: followUpsErr.stack, input:
          {campaignId: campaign.id}});
        return callback(err);
      }
      return callback(null, followUps, campaign);
    });
  };

  /**
   * Method to Get Stopped FollowUps for a Campaign
   * @param  {Campaign}   campaign
   * @param  {Function} callback
   * @param {[FollowUp]} List of Updated FollowUps
   * @author Syed Sulaiman M
   */
  const scheduleFollowUps = (followUps, campaign, callback) => {
    if(lodash.isEmpty(followUps)) return callback(null, []);
    const resumedStatusCode = statusCodes.followUpResumed;
    let pastFollowUps = lodash.filter(followUps, (o) => {
      return o.scheduledAt < Date.now();
    });
    pastFollowUps = lodash.sortBy(pastFollowUps, "stepNo");

    let futureFollowUps = lodash.filter(followUps, (o) => {
      return o.scheduledAt > Date.now();
    });
    futureFollowUps = lodash.sortBy(futureFollowUps, "stepNo");

    if(lodash.isEmpty(pastFollowUps)) {
      Campaign.app.models.followUp.updateFollowUpsStatus(followUps,
          resumedStatusCode, (updateErr, updatedFollowUps) => {
        if(updateErr) return callback(updateErr);
        return callback(null, updatedFollowUps);
      });
    } else {
      Campaign.app.models.followUp.scheduleFollowUps(pastFollowUps, campaign,
          (err, response) => {
        if(err) return callback(err);
        let followUps = lodash.unionBy(pastFollowUps, futureFollowUps, "id");
        Campaign.app.models.followUp.updateFollowUpsStatus(followUps,
            resumedStatusCode, (updateErr, updatedFollowUps) => {
          if(updateErr) return callback(updateErr);
          return callback(null, updatedFollowUps);
        });
      });
    }
  };

  Campaign.remoteMethod(
    "openClickRate",
    {
      description: "Save the campaign tempalate and associates with list",
      accepts: [{
        arg: "ctx", type: "object", http: {source: "context"}
      }, {
        arg: "id", type: "any", required: true, http: {source: "path"}
      }],
      returns: {arg: "object", type: "object", root: true},
      http: {
        verb: "get", path: "/:id/openClickRate"
      }
    }
  );

  /**
   * API to get Open and Click Rate for Emails
   * @param  {context}   ctx      [description]
   * @param  {Number}   id       CampaignId
   * @param  {Function} callback
   * @return {Object}      Object conatins Open and Click rate for Emails
   * @author Syed Sulaiman M
   */
  Campaign.openClickRate = (ctx, id, callback) => {
    Campaign.findById(id, (campaignErr, campaign) => {
      if(campaignErr) {
        logger.error("Error while getting campaign", {error: campaignErr,
          stack: campaignErr.stack, input:{campaignId:id}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if(!campaign) {
        const errorMessage = errorMessages.CAMPAIGN_NOT_FOUND;
        return callback(errorMessage);
      }
      async.parallel({
        clickRate: getClickedEmailLinkRate.bind(null, campaign),
        openRate: getOpenedEmailRate.bind(null, campaign)
      }, (parallelErr, result) => {
        if(parallelErr) {
          logger.error("Error while processing campaign for rate",
            {error: campaignErr, stack: campaignErr.stack,
            input:{campaignId:id}});
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        let graphData = constructGraphData(result.openRate, result.clickRate);
        return callback(null, graphData);
      });
    });
  };

  /**
   * Construct Graph Data for open and click rate
   * @param  {Object} openRate
   * @param  {Object} clickRate
   * @return {Object} graphData
   * @author Syed Sulaiman M
   */
  const constructGraphData = (openRate, clickRate) => {
    let rateData = [], graphData = {}, minCount = 0, maxCount = 0;
    let startDate = null, endDate = null, startDateTmp = null,
        endDateTmp = null;
    if(openRate) {
      let openRateKeys = Object.keys(openRate);
      let openStartDate =
        new Date(openRateKeys[openRateKeys.length-constants.ONE]);
      let openEndDate = new Date(openRateKeys[0]);
      startDate = openStartDate;
      endDate = openEndDate;
      startDateTmp = openRateKeys[openRateKeys.length-constants.ONE];
      endDateTmp = openRateKeys[0];
    }
    if(clickRate) {
      let clickRateKeys = Object.keys(clickRate);
      let clickStartDate =
        new Date(clickRateKeys[clickRateKeys.length-constants.ONE]);
      let clickEndDate = new Date(clickRateKeys[0]);
      if(startDate && startDate > clickStartDate) {
        startDate = clickStartDate;
        startDateTmp = clickRateKeys[clickRateKeys.length-constants.ONE];
      }
      if(!startDate) {
        startDate = clickStartDate;
        startDateTmp = clickStartDate;
      }

      if(endDate && endDate < clickEndDate) {
        endDate = clickEndDate;
        endDateTmp = clickRateKeys[0];
      }
      if(!endDate) {
        endDate = clickEndDate;
        endDateTmp = clickRateKeys[0];
      }
    }
    if(startDate && endDate) {
      let generatedDates = dateUtil.generateDatesWithOneDayInterval(
          startDate, endDate);
      lodash(generatedDates).forEach( (o) => {
        let rateDataInst = {
          [o]: {
            openRate: (openRate[o]) ? openRate[o] : constants.ZERO,
            clickRate: (clickRate[o]) ? clickRate[o] : constants.ZERO
          }
        };

        if(minCount === constants.ZERO || minCount > rateDataInst[o].openRate)
          minCount = rateDataInst[o].openRate;
        if(minCount === constants.ZERO || minCount > rateDataInst[o].clickRate)
          minCount = rateDataInst[o].clickRate;

        if(maxCount < rateDataInst[o].openRate)
          maxCount = rateDataInst[o].openRate;
        if(maxCount < rateDataInst[o].clickRate)
          maxCount = rateDataInst[o].clickRate;

        rateData.push(rateDataInst);
      });
    }

    graphData.minCount = minCount;
    graphData.maxCount = maxCount;
    graphData.graphData = rateData;
    graphData.interval = "1D";
    graphData.startDate = startDateTmp;
    graphData.endDate = endDateTmp;
    return graphData;
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
      return validateSaveCB(errorMessages.EMPTY_LIST);
    }
    if(!reqParams.hasOwnProperty("campaignTemplates")) {
      return validateSaveCB(errorMessages.TEMPLATE_NOT_FOUND);
    }
    async.eachSeries(reqParams.campaignTemplates, (template, templateCB) => {
      const templateSubject = striptags(template.subject);
      if(templateSubject.trim().length) return templateCB(null);
      return validateSaveCB(errorMessages.EMPTY_SUBJECT);
    }, (asyncErr) => {
      return validateSaveCB(asyncErr, ctx, id, reqParams);
    });
  };

  /**
   * Get the campaign for the campaign id and for the current user
   * @param  {[ctx]} ctx
   * @param  {[id]} id
   * @param  {[reqParams]} reqParams
   * @param  {[function]} getCampaignCB
   * @return {[campaign, reqParams]}
   * @author Ramanavel Selvaraju
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
             error: campaignErr,
             stack: campaignErr ? campaignErr.stack : ""
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
      "statusCode": statusCodes.updated,
      "userDate": reqParams.campaign.userDate,
      "isTTSEnabled" : false
    };
    if(reqParams.campaign.isTTSEnabled) {
      campaignUpdateElements.isTTSEnabled = reqParams.campaign.isTTSEnabled;
    }
    if(reqParams.campaign.scheduledAt) {
      campaignUpdateElements.scheduledAt = reqParams.campaign.scheduledAt;
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
  /*const formatDate = (dateString, timeString) => {
    const formatedDate = new Date(dateString + " " + timeString + " " +
     systemTimeZone);
    return formatedDate;
  };*/


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
      reCreateCampaignElementsCB(null, campaign, "assembler");
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
  const enqueueToMailAssembler = (campaign, transit,
      callback) => {
    let queueName = "emailAssembler";
    let queueData = {
      campaign: campaign,
      action: transit === "assembler" ? "assembled" : "resumed"
    };
    queueUtil.enqueueMail(JSON.stringify(queueData), queueName,
      (err, response) => {
      if(err) return callback(err);
      return callback(null, "Enqueued successfully!");
    });
  };


  /**
   * Method to update the status audit table and set the isStopped status for the
   * campaign to false
   * @param  {[campaign]} campaign
   * @param  {[resumeStatusCode]} resumeStatusCode
   * @param  {[function]} updateCB
   * @return {[result]}
   * @author Aswin Raj A
   */
  const updateStatusProcess = (campaign, resumeStatusCode, updateCB) => {
    async.parallel({
      updateAudit: Campaign.app.models.campaignStatusAudit.createAudit
        .bind(null, campaign, resumeStatusCode),
      setStatus: Campaign.setStatus.bind(null, campaign, resumeStatusCode)
    }, (parallelErr, result) => {
      if(parallelErr){
        updateCB(parallelErr);
      }
      updateCB(null, result);
    });
  };

  /**
   * Method to update the statusCode for the current campaign
   * @param  {[campaign]} campaign
   * @param  {[statusCode]} statusCode
   * @param  {[function]} setStatusCB
   * @return {[response]}
   * @author Aswin Raj A
   */
  Campaign.setStatus = (campaign, statusCode, setStatusCB) => {
    campaign.updateAttribute("statusCode", statusCode,
    (statusUpdateErr, updatedStatus) => {
      if(statusUpdateErr){
        logger.error("Error on updating campaign : ", {
          input: {campaign: campaign.id},
           error: statusUpdateErr, stack: statusUpdateErr.stack});
         return setStatusCB(statusUpdateErr);
      }
      return setStatusCB(null, "Status updated successfully!");
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
   * Method to return Campaign with Links
   * @param  {Number} campaignId
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  Campaign.getCampaignWithEmailLinks = (campaignId, callback) => {
    Campaign.findById(campaignId, {
      include: ["emailLinks", "clickedEmailLinks"],
    }, (campaignError, campaign) => {
      if (campaignError) {
        logger.error({
          error: campaignError, stack: campaignError.stack,
          input: {campaignId: campaignId}
        });
        return callback(campaignError);
      }
      return callback(null, campaign);
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
  Campaign.generateEmail = (campaign, person, listIds, followup, ttsMetaMap,
     generateEmailCB) => {
    async.waterfall([
      async.apply(preaprePersonObject, campaign, person, listIds, followup),
      getTemplate,
      applySmartTags,
      appendOpenTracker,
      appendLinkClickTracker,
      appendBottomPart,
      function(campaign, followup, person, email, setArgs) {
        setArgs(null, campaign, followup, person, email, ttsMetaMap);
      },
      prepareScheduledAt,
      preapreFollowUp,
      sendToEmailQueue,
      incrementAssmebedCountInMetrics
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
  const appendBottomPart = (campaign, followup, person, email,
        appendUnsubscribeLinkCB) => {
    if(followup){
      return appendUnsubscribeLinkCB(null, campaign, followup, person, email);
    }
    if(!campaign.isAddressNeeded && !campaign.isOptTextNeeded) {
      return appendUnsubscribeLinkCB(null, campaign, followup, person, email);
    }
    let bottomContent = email.content;
    let bottom = `<div style="width: 100%;border-top: 1px solid #c2c2c2;\
    padding-top: 0;margin-top: 20px;"><table style="width: 100%; margin-top:\
    10px;"><tbody><tr style="color:#c2c2c2;"><td style="width: 50%;float: left;\
    padding: 0;">${campaign.isAddressNeeded ? campaign.address : ""}\
    </td></td><td style="width:50%;text-align:right;padding: 0;">`;
    if(campaign.isOptTextNeeded) {
      email.unSubscribeToken = uuid.v1();
      const url = `${serverUrl}/unsubscribe/${email.unSubscribeToken}`;
      const optText = campaign.optText ? campaign.optText : Unsubscribe;
      bottom += `<a class="unsubscribe" href="${url}">${optText}</a>`;
    }
    bottom += "</td></tr></tbody></table></div>";
    bottomContent += bottom;
    email.content = bottomContent;
    return appendUnsubscribeLinkCB(null, campaign, followup, person, email);
  };

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
    let url = `${serverUrl}/api/openedEmails/campaign/${campaign.id}/person/` +
      `${person.id}`;
    if(followup) {
      url += `/followUp/${followup.id}/trackFollowUp`;
    } else {
      url += "/trackEmail";
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
      href = lodash.replace(href, /(')/g, "\"");
      let linkurl = href.split(/"/)[1];
      Campaign.app.models.emailLink.getOrSave(campaign, linkurl, followup,
        (getOrSaveErr, link) => {
        if(getOrSaveErr) {
          return hrefTagsCB(getOrSaveErr);
        }
        let content = email.content;
        let proxyUrl = `${serverUrl}/api/emailLinks/${link.id}`;
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
  const prepareScheduledAt = (campaign, followup, person, email, ttsMetaMap,
    prepareScheduledAtCB) => {
    const scheduledAtFromUser = getScheduledAtFromUser(campaign, followup);
    ttsMetaMap.default = ttsMetaMap.default ? ttsMetaMap.default : new Date();
    let scheduledAt = ttsMetaMap.default;
    let ttsType = "default";
    if (scheduledAtFromUser) {
      if (person.timeZone) {
        scheduledAt = calculateZoneBasedScheduledAt(scheduledAtFromUser,
          person, ttsMetaMap);
      } else {
        if(!ttsMetaMap.scheduledAtFromUser)
          ttsMetaMap.scheduledAtFromUser = new Date(scheduledAtFromUser);
        scheduledAt = ttsMetaMap.scheduledAtFromUser;
      }
      ttsType = person.timeZone ? person.timeZone : "scheduledAtFromUser";
    }
    calculateTTS(campaign, ttsMetaMap, scheduledAt, ttsType);
    email.scheduledAt = scheduledAt;
    return prepareScheduledAtCB(null, campaign, followup, person, email);
  };

  /**
   * checks TTS enabled and appends in TTS map
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {JSON} ttsMetaMap
   * @param  {Date} scheduledAt
   * @param  {String} type                [type of timezone or defult]
   * @author Ramanavel Selvaraju
   */
  const calculateTTS = (campaign, ttsMetaMap, scheduledAt, type) => {
    if(campaign.isTTSEnabled){
      ttsMetaMap[type] = new Date(moment(scheduledAt)
        .add(lodash.random(constants.ttsInterval), "minutes"));
    }
  };

  /**
   * If the Scheduled At is in past it will scheduled as current time
   * It will assume that it will generate now()
   *
   * @param  {[campaign]} campaign         [current campign object]
   * @param  {[Followup]} followup         [current followup object]
   * @param  {[Array]} additionalValues [extra field values for that person
   * @return {[type]}          [description]
   * @author Ramanavel Selvaraju
   */
  const getScheduledAtFromUser = (campaign, followup) => {
    let scheduledAtFromUser = followup ? followup.scheduledAt
                                       : campaign.scheduledAt;
    if(lodash.lt((scheduledAtFromUser- new Date()), constants.ZERO)) {
      return new Date();
    }
    return scheduledAtFromUser;
  };

  /**
   * calculates zone based scheduled at and returns
   * If the Person time is behind the current time this will
   * schedule for next day
   * @param  {Date} scheduledAtFromUser
   * @param  {Person} person
   * @return {Date}  scheduledAt
   * @author Ramanavel Selvaraju
   */
  const calculateZoneBasedScheduledAt = (scheduledAtFromUser, person,
    ttsMetaMap) => {
    if (ttsMetaMap[person.timeZone]) {
      return ttsMetaMap[person.timeZone];
    }
    const personZoneTime = moment(scheduledAtFromUser)
      .tz(person.timeZone).format("YYYY-MM-DDTHH:mm:ss");
    let scheduledAt = new Date(personZoneTime + moment().format("Z"));
    const diff = scheduledAt
      - new Date(moment(new Date()).add(constants.MINUS_TEN, "minutes"));
    if(!lodash.gt(diff, constants.ZERO)){
        scheduledAt =
          new Date(moment(scheduledAt).add(constants.ONE, "days").format());
    }
  return scheduledAt;
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
          email.followUpId = followup.id;
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
   * @author Ramanavel Selvaraju
   */
  const sendToEmailQueue = (campaign, followup, person, email,
    sendToEmailQueueCB) => {
    if(!email.subject) email.subject = "(no subject)";
    email.subject = email.subject.replace(/&nbsp;/g, " ");
    email.subject = lodash.trim(striptags(email.subject));
    email.subject = entities.decode(email.subject);
    Campaign.app.models.emailQueue.create(email,
      (emailQueueErr, emailQueueObj) => {
      if (emailQueueErr) {
        return sendToEmailQueueCB(emailQueueErr);
      }
      logger.info("Pushed Email to the Queue", emailQueueObj);
      sendToEmailQueueCB(null, campaign, followup, person, email);
    });

  };

  /**
   * increments the camapain and list metrics assmebled count
   * if it is a followup increments followup also
   *
   * @param  {[Campaign]} campaign
   * @param  {[FollowUp]} followup
   * @param  {[Person]} person
   * @param  {[Object]} email
   * @param  {[function]} sendToEmailQueueCB
   * @author Ramanavel Selvaraju
   */
  const incrementAssmebedCountInMetrics = (campaign, followup, person,
      email, callback) => {
    const property = email.isError ? "errorInAssmebler" : "assembled";
    if(followup) {
      Campaign.app.models.followUpMetric.getAndIncrementByProperty(
        followup, property, (followUpMetricErr) => {
          return callback(followUpMetricErr);
      });
    } else {
      async.parallel([
       async.apply(Campaign.app.models.campaignMetric.getAndIncrementByProperty,
         campaign, property),
       async.apply(Campaign.app.models.listMetric.getAndIncrementByProperty,
         campaign, person, property)
      ], (parallelErr) => {
        if(parallelErr) {
          return callback(parallelErr);
        }
        return callback(null);
      });
    }
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
    let msg = `Status not Matching Aborting! CampaignId : ${campaign.id}`;
    if(followup) msg += ` FollowUpId : ${followup.id}`;
    let error = new Error(msg);
    error.name = "StatusMismatchError";
    if(followup) {
      if(campaign.statusCode < statusCodes.readyToSend ||
        followup.statusCode !== statusCodes.followUpProcessing) {
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
        const errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
        return getCurrentCampaignMetricsCB(errorMessage);
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
            if(lodash.isEmpty(campaignMetricsData)){
              const totalLinks = emailLinks.length;
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
              buildCampaignMetricObject(campaignMetricArray,
                emptyCampaignMetricsData, totalLinks,
                (err, campaignMetricsObj) => {
                  getCurrentCampaignMetricsCB(null, campaignMetricsObj);
                });
            } else {
              const totalLinks = emailLinks.length;
              buildCampaignMetricObject(campaignMetricArray,
                campaignMetricsData[0], totalLinks,
                (err, campaignMetricsObj) => {
                  getCurrentCampaignMetricsCB(null, campaignMetricsObj);
                });
            }
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
      returns: {arg: "campaign", type: "campaign", root: true},
      http: {
        verb: "get", path: "/hasRecentCampaign"
      }
    }
  );

  /**
   * To check if there is any recent campaign for the current user
   * @param  {[ctx]}  ctx
   * @param  {function} callback
   * @return {[boolean]} hasRecentCampaign
   * @author Aswin Raj A, Syed Sulaiman M(Modified)
   */
  Campaign.hasRecentCampaign = (ctx, callback) => {
    let userId = ctx.req.accessToken.userId;
    Campaign.find({
      where: {
        "createdBy": userId
      },
      order: "lastRunAt DESC, createdAt DESC"
    }, (campaignErr, campaigns) => {
      if(campaignErr){
        logger.error("Error while getting recent campaign for user", {
          error: campaignErr, stack: campaignErr.stack,
          input: {userId: userId}
        });
        return callback(errorMessages.SERVER_ERROR);
      }
      if(lodash.isEmpty(campaigns)) return callback(null);

      let lastRunCampaign = lodash.find(campaigns, function(o) {
        return o.lastRunAt ? true : false;
      });
      if(lastRunCampaign) return callback(null, lastRunCampaign);

      return callback(null, campaigns[0]);
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
            let clickRate = (campaignMetricsData.clicked /
              (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
            ) * hundredPercent;
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
            let responseRate = (campaignMetricsData.actionable /
              campaignMetricsData.sentEmails) * hundredPercent;
            let roundresponseRate = Math.round(parseFloat(responseRate));
            campaignMetricObj.percentage = roundresponseRate || "0";
            campaignMetricObj.count = campaignMetricsData.actionable;
            campaignMetricObj.class = "";
            campaignMetricObj.status = "";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "BOUNCED":
            campaignMetricObj.title = "bounced";
            let bouncedRate = (campaignMetricsData.bounced
              / campaignMetricsData.sentEmails) * hundredPercent;
            let roundbouncedRate = Math.round(parseFloat(bouncedRate));
            campaignMetricObj.percentage = roundbouncedRate || "0";
            campaignMetricObj.count = campaignMetricsData.bounced || "0";
            campaignMetricObj.class = "red";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "UNSUBSCRIBED":
            campaignMetricObj.title = "unsubscribed";
            let unsubscribedRate = (campaignMetricsData.unsubscribed
              / (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
            ) * hundredPercent;
            let roundunsubscribeRate = Math.round(parseFloat(unsubscribedRate));
            campaignMetricObj.percentage = roundunsubscribeRate || "0";
            campaignMetricObj.count = campaignMetricsData.unsubscribed || "0";
            campaignMetricObj.class = "green";
            campaignMetricObj.status = "7";
            campaignMetricObject.push(campaignMetricObj);
            break;
          case "SPAM":
            campaignMetricObj.title = "spam";
            let spamRate = (campaignMetricsData.spammed /
              (campaignMetricsData.sentEmails - campaignMetricsData.bounced)
            ) * hundredPercent;
            let roundspamRate = Math.round(parseFloat(spamRate));
            campaignMetricObj.percentage = roundspamRate || "0";
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
      if(!campaign)
        return getCurrentCampaignDetailsCB(errorMessages.INVALID_CAMPAIGN_ID);
      currentCampaignDetailsObj.campaignId = campaign.id;
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
   * @author Syed Sulaiman M,Naveen Kumar(Modified)
   */
  Campaign.campaignReport = (ctx, id, callback) => {
    let campaignReport = {
      sentEmails: 0,
      responses: 0,
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
      async.parallel({
        metric: getMetricByCampaign.bind(null, campaign.id),
        followup: getFollowUpByCampaign.bind(null, campaign.id,
          statusCodes.followUpSent)
      }, (parallelErr, result) => {
        if(parallelErr) {
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        if(result.metric) {
          campaignReport.sentEmails = result.metric.sentEmails;
          campaignReport.deliveredEmails = result.metric.sentEmails
            - result.metric.bounced;
          campaignReport.responses = result.metric.actionable
            + result.metric.nurture + result.metric.negative;
          campaignReport.followUpsSent = result.followup.length;
        }
        return callback(null, campaignReport);
      });
    });
  };

  /**
   * Gets metrics for the corresponding campaignId
   *
   * @param  {Number} campaignId
   * @param  {function} callback
   * @return {Object} Metric
   * @author Naveen Kumar
   */
  const getMetricByCampaign = (campaignId, callback) => {
    Campaign.app.models.campaignMetric.getMetricByCampaignId(campaignId,
        (metricErr, metric) => {
      if(metricErr) {
        return callback(metricErr);
      }
      return callback(null, metric);
    });
  };

  /**
   * Gets followups for the corresponding campaignId and status code
   *
   * @param  {Number} campaignId
   * @param  {Number} statusCode
   * @param  {function} callback
   * @return {Object} Followup
   * @author Naveen Kumar
   */
  const getFollowUpByCampaign = (campaignId, statusCode, callback) => {
    Campaign.app.models.FollowUp.getFollowUpByCampaignAndStatus(campaignId,
      statusCode, (followupErr, followup) => {
      if(followupErr) {
        return callback(followupErr);
      }
      return callback(null, followup);
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


  /**
   * Process 1 of listMetricEntry
   * - Get all the list for the campaign in which the current person exist
   * @param  {[campaignId]} campaignId
   * @param  {[personId]} personId
   * @param  {[function]} getListCB
   * @return {[campaignList, campaignId, personId]}
   * @author Aswin Raj A
   */
  Campaign.getCampaignListForPerson = (campaignId, personId, getListCB) => {
    async.parallel({
      campaign: getCampaignList.bind(null, campaignId),
      person: getPersonList.bind(null, personId)
    }, (parallelErr, result) => {
      if(parallelErr) {
        logger.error(parallelErr);
        return getListCB(parallelErr);
      }
      let campaignList = lodash.intersectionBy(result.campaign,
        result.person, "id");
      return getListCB(null, campaignList, campaignId, personId);
    });
  };

  /**
   * To get all list associated with the current campaign
   * @param  {[campaignId]} campaignId
   * @param  {[function]} getCampaignListCB
   * @return {[campaignList]}
   * @author Aswin Raj A
   */
  const getCampaignList = (campaignId, getCampaignListCB) => {
    Campaign.findById(campaignId, (campaignFindErr, campaign) => {
      if(campaignFindErr || !campaign){
        const errParam = campaignFindErr || "Campaign not found!";
        logger.error("Error while finding campaign", {
          input: {campaignId: campaignId},
          error: campaignFindErr,
          stack: campaignFindErr ? campaignFindErr.stack : ""
        });
        return getCampaignListCB(errParam);
      }
      campaign.lists((listFindErr, campaignList) => {
        if(listFindErr){
          const errParam = listFindErr || "No List for Campaign!";
          logger.error("Error while finding list for campaign", {
            input: {campaignId: campaignId},
            error: listFindErr,
            stack: listFindErr ? listFindErr.stack : ""
          });
          return getCampaignListCB(errParam);
        }
        return getCampaignListCB(null, campaignList);
      });
    });
  };

  /**
   * To get all the list associated with the current person
   * @param  {[personId]} personId
   * @param  {[function]} getPersonListCB
   * @return {[personList]}
   * @author Aswin Raj A
   */
  const getPersonList = (personId, getPersonListCB) => {
    Campaign.app.models.person.findById(personId,
      (personFindErr, person) => {
      if(personFindErr || !person){
        const errParam = personFindErr || "Person not found!";
        logger.error("Error while finding person", {
          input: {personId: personId},
          err: personFindErr,
          stack: personFindErr ? personFindErr.stack : ""
        });
        return getPersonListCB(errParam);
      }
      person.lists((listFindErr, personList) => {
        if(listFindErr){
          const errParam = listFindErr || "No List for Person!";
          logger.error("Error while finding list for person", {
            input: {personId:personId},
            error: listFindErr,
            stack: listFindErr ? listFindErr.stack : ""
          });
          return getPersonListCB(errParam);
        }
        return getPersonListCB(null, personList);
      });
    });
  };

  /**
   * Date Wise Click Rate for emails
   * @param  {Campaign}   campaign
   * @param  {Function} callback [description]
   * @return {Object}            Clickrate
   * @author Syed Sulaiman M
   */
  const getClickedEmailLinkRate = (campaign, callback) => {
    campaign.clickedEmailLinks((error, clickedEmailLinks) => {
      let clickedEmailLinksTmp = [], clickRate = {};
      lodash(clickedEmailLinks).forEach( (o) => {
        o.createdAt = new Date(
          new Date(o.createdAt).getFullYear(),
          new Date(o.createdAt).getMonth(),
          new Date(o.createdAt).getDate());
        clickedEmailLinksTmp.push(o);
      });
      let grpdclickedEmailLinks =
          lodash.groupBy(clickedEmailLinksTmp, "createdAt");
      let keys = lodash.keys(grpdclickedEmailLinks);
      keys = lodash.sortBy(keys);
      lodash(keys).forEach( (o) => {
        clickRate[o] = grpdclickedEmailLinks[o].length;
      });
      return callback(null, clickRate);
    });
  };

  /**
   * Date Wise Open Rate for emails
   * @param  {Campaign}   campaign
   * @param  {Function} callback [description]
   * @return {Object}            Openrate
   * @author Syed Sulaiman M
   */
  const getOpenedEmailRate = (campaign, callback) => {
    campaign.openedEmail((error, openedEmails) => {
      let openedEmailsTmp = [], openRate = {};
      lodash(openedEmails).forEach( (o) => {
        o.createdAt = new Date(
          new Date(o.createdAt).getFullYear(),
          new Date(o.createdAt).getMonth(),
          new Date(o.createdAt).getDate());
        openedEmailsTmp.push(o);
      });
      let grpdOpenedEmail = lodash.groupBy(openedEmailsTmp, "createdAt");
      let keys = lodash.keys(grpdOpenedEmail);
      keys = lodash.sortBy(keys);
      lodash(keys).forEach( (o) => {
        openRate[o] = grpdOpenedEmail[o].length;
      });
      return callback(null, openRate);
    });
  };

  Campaign.remoteMethod(
    "emailListsForCampaign",
    {
      description: "Get lists and person for campaign",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number", required: true, http: {source: "path"}}
      ],
      returns: {arg: "emailList", type: "object", root: true},
      http: {verb: "get", path: "/:id/list"}
    }
  );

  /**
   * Get the Campaign Lists with person count for the given Campaign Id
   * Example: Return Object
   *  emailLists: [{listId: 1,
   *                listName: "Stock Recepients",
   *                recepientCount: 37}]
   * @param  {Object} ctx Context object to get accessToken
   * @param  {Number} id [campaign id]
   * @param  {function} getCampaignListsCB
   * @return {Object} List with Person
   * @author Rahul Khandelwal
   */
  Campaign.emailListsForCampaign = (ctx, campaignId, getCampaignListsCB) => {
    async.waterfall([
      async.apply(getCampaignList, campaignId),
      getListsRecepient
    ], (asyncErr, emailLists) => {
      return getCampaignListsCB(asyncErr, emailLists);
    });
  };

  /**
   * Get the list with recepient Count for the given Campaign Id
   * @param  {object} lists lists for campaign
   * @param  {function} campaignListCB
   * @return {Object} List with Person
   * @author Rahul Khandelwal
   */
  const getListsRecepient = (lists, campaignListCB) => {
    let listsWithPerson = [];
    async.each(lists, (list, listCallBack) => {
      list.people((peopleListErr, peopleList) => {
        if(peopleListErr){
          logger.error("Error while finding people for list",
              {input : {listId:list.id}, error: peopleListErr,
                stack: peopleListErr ? peopleListErr.stack : ""});
          return listCallBack(peopleListErr);
        }
        const listObj = {
          listId: list.id,
          listName: list.name,
          recepientCount: peopleList.length
        };
        listsWithPerson.push(listObj);
        return listCallBack(null);
      });
    }, (asyncEachErr) => {
      return campaignListCB(asyncEachErr, listsWithPerson);
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
