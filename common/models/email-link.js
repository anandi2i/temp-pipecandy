"use strict";

import logger from "../../server/log";
import lodash from "lodash";
import async from "async";
import config from "../../server/config.json";

module.exports = function(EmailLink) {

  EmailLink.remoteMethod(
    "track", {
      accepts: [{
        arg: "campaignId",
        type: "number"
      }, {
        arg: "personId",
        type: "number"
      }, {
        arg: "linkId",
        type: "number"
      }, {
        arg: "res",
        type: "object",
        "http": {
          source: "res"
        }
      }, {
        arg: "req",
        type: "object",
        "http": {
          source: "req"
        }
      }
      ],
      http: {
        path: "/:linkId/campaign/:campaignId/person/:personId/track",
        verb: "GET"
      }
    }
  );

  /**
   * Build tracking machinism of a link which we sent vai email
   * Logic:
   * Gets the EmailLink Object
   * Adds an entry on Clicked Email Links models
   * Increments the EmailLink, list and campaign metrics clicked count
   *
   * http://localhost:3001/api/emailLinks/:emailLinkId/campaign/:campaignId/person/:personId/track

   * @param  {[number]} campaignId
   * @param  {[number]} personId
   * @param  {[number]} emailLinkId
   * @param  {[Response]} res
   * @return {[type]}
   * @author Ramanavel Selvaraju
   */
  EmailLink.track = (campaignId, personId, linkId, res, req) => {
    let reqParams = {
      campaignId: campaignId,
      personId: personId,
      emailLinkId: linkId
    };
    EmailLink.findById(linkId, (linkFindErr, link) => {
      if(linkFindErr || !link) {
        reqParams.error = linkFindErr;
        logger.error("Finding an Link Obj Error:", {linkId: linkId,
          personId:personId, error: linkFindErr,
          stack: linkFindErr.stack});
        return res.redirect(config.redirectURL);
      }
      //If the request is from www.pipecandy.com alone process it, else just
      //redirect it
      if(req.headers.referer !== config.emailHost){
        isCampaignSent(reqParams.campaignId,
          (isCampaignSentErr, isCampaignSentResponse) => {
            logger.error(isCampaignSentErr, isCampaignSentResponse);
          if(isCampaignSentResponse){
            updateMetrics(reqParams, link, (updateMetricsErr) => {
              if(updateMetricsErr) {
                logger.error("Update Metrics Error:", {error: updateMetricsErr,
                  stack: updateMetricsErr.stack});
                return res.redirect(config.redirectURL);
              }
              res.redirect(link.linkurl);
            });
          } else{
            res.redirect(link.linkurl);
          }
        });
      } else{
        res.redirect(link.linkurl);
      }
    });
  };

  const isCampaignSent = (campaignId, isCampaignSentCB) => {
    EmailLink.app.models.campaign.findById(campaignId,
      (campaignFindErr, campaign) => {
        if(campaignFindErr || !campaign){
          reqParams.error = campaignFindErr;
          logger.error("Error while finding campaign:", {error: campaignFindErr,
            stack: campaignFindErr.stack});
          return isCampaignSentCB(campaignFindErr);
        }
        if(campaign.isSent){
          return isCampaignSentCB(null, true);
        }
        return isCampaignSentCB(null, false);
    });
  };


  const updateMetrics = (reqParams, link, updateMetricsCB) => {
    EmailLink.app.models.clickedEmailLink.find({
      where: {
        and: [{
          campaignId: reqParams.campaignId
        }, {
          personId: reqParams.personId
        }]
      }
    }, (clickedLinkErr, linkMetrics) => {
      if(clickedLinkErr) {
        logger.error("Finding an LinkMetrics Obj Error:",
        {reqParams: reqParams, link:link, error: clickedLinkErr,
          stack: clickedLinkErr.stack});
        return updateMetricsCB(clickedLinkErr);
      }
      if(lodash.isEmpty(linkMetrics)) {
        updateAllLinkRelatedMetrics(reqParams, (updateCounterCacheErr) => {
          return updateMetricsCB(updateCounterCacheErr);
        });
      } else{
        const clikedlinks = lodash.find(linkMetrics, lodash.matchesProperty(
          "emailLinkId", lodash.toInteger(reqParams.emailLinkId)));
        if(clikedlinks) {
          EmailLink.app.models.clickedEmailLink.addMetrics(reqParams,
            (linkMetricAddMetricsErr) => {
              return updateMetricsCB(linkMetricAddMetricsErr);
            });
        } else{
          updatelinkAndLinkMetrics(reqParams, (updatelinkAndLinkMetricsErr) => {
            return updateMetricsCB(updatelinkAndLinkMetricsErr);
          });
        } //else if(clikedlinks)
      } //else if(lodash.isEmpty(linkMetrics)){
    });
  };

  const updateAllLinkRelatedMetrics = (reqParams,
    updateAllRelatedMetricsCB) => {
    async.parallel({
      linkRelated: updatelinkAndLinkMetrics.bind(null, reqParams),
      campaignAndList: updateListAndCampaignMetrics.bind(null, reqParams)
    }, (parallelErr, results) => {
      if(parallelErr) {
        logger.error("On async.parallel updateAllRelatedMetrics",
        {reqParams: reqParams, error: parallelErr, stack: parallelErr.stack});
        return updateAllRelatedMetricsCB(parallelErr);
      }
      return updateAllRelatedMetricsCB(null);
    });
  };

  const updatelinkAndLinkMetrics = (reqParams, updatelinkAndLinkMetricsCB) => {
    async.parallel({
      clickedEmailLink: EmailLink.app.models.clickedEmailLink.addMetrics.bind(
        null, reqParams),
      link: addMetrics.bind(null, reqParams)
    }, (parallelErr, results) => {
      if(parallelErr) {
        logger.error("On async.parallel updatelinkAndLinkMetrics",
      {reqParams: reqParams, error: parallelErr, stack: parallelErr.stack});
        return updatelinkAndLinkMetricsCB(parallelErr);
      }
      return updatelinkAndLinkMetricsCB(null);
    });
  };

  const updateListAndCampaignMetrics = (reqParams, updateCounterCacheCB) => {
    async.parallel({
      campaign: EmailLink.app.models.campaignMetric.addMetrics.bind(null,
        reqParams, "Link"),
      lists: EmailLink.app.models.listMetric.addMetrics.bind(null,
        reqParams, "Link")
    }, (parallelErr, results) => {
      if(parallelErr) {
        logger.error("Error on async.parallel updateMetrics",
        {reqParams: reqParams, error: parallelErr, stack: parallelErr.stack});
        return updateCounterCacheCB(parallelErr);
      }
      return updateCounterCacheCB(null);
    });
  };

  const addMetrics = (reqParams, addEmailMetricsCB) => {
    EmailLink.findById(reqParams.emailLinkId,
      (emailLinkFindErr, emailLinkData) => {

      if(emailLinkFindErr || !emailLinkData){
        logger.error("Error on updating emailLink",
        {reqParams: reqParams, error: emailLinkFindErr,
          stack: emailLinkFindErr.stack});
        return addEmailMetricsCB(emailLinkFindErr);
      }
      emailLinkData.updateAttribute("clickedCount",
      ++emailLinkData.clickedCount,
       (emailLinkDataUpdateErr, updatedemailLink) => {
         if(emailLinkDataUpdateErr){
           logger.error("Error on updating emailLink",
           {error: emailLinkDataUpdateErr,
             stack: emailLinkDataUpdateErr.stack});
           return addEmailMetricsCB(emailLinkDataUpdateErr);
         }
         addEmailMetricsCB(null, "EmailLink updated");
      });

    });
  };

  EmailLink.remoteMethod(
    "getRecentCampaignLinkMetrics", {
      description: "Get clicked link metrics for current campaign",
      accepts: [{arg: "ctx", type: "object", http: {source: "context"}}],
      returns: {
        arg: "recentCampaignLinkMetrics",
        type: "object"
      },
      http: {
        path: "/getRecentCampaignLinkMetrics",
        verb: "GET"
      }
    }
  );

  /**
   * Get the recent metrics for the recent campaign
   * @param  {[ctx]} ctx
   * @param  {[function]} getRecentCampaignLinkMetricsCB
   * @return {[recentCampaignLinkMetrics]}
   * @author Aswin Raj A
   */
  EmailLink.getRecentCampaignLinkMetrics = (ctx,
    getRecentCampaignLinkMetricsCB) => {


    async.waterfall([
      async.apply(getRecentCampaign, ctx, campaignLinkMetrics),
      getEmailLinksForCampaign,
      getClickedCountForEmailLinks
    ], (asyncErr, recentCampaignLinkMetrics) => {
      if(asyncErr){
        logger.error("Error while getting recent campaign link metrics",
        {error: asyncErr, stack: asyncErr.stack});
        return getRecentCampaignLinkMetricsCB(asyncErr);
      }
      getRecentCampaignLinkMetricsCB(null, recentCampaignLinkMetrics);
    });
  };


  /**
   * For process getRecentCampaignLinkMetrics:
   * - Get the recent campaign for the current user
   * @param  {[ctx]} ctx
   * @param  {[campaignLinkMetrics]} campaignLinkMetrics
   * @param  {[function]} getRecentCampaignCB
   * @return {[campaign, campaignLinkMetrics]}
   * @author Aswin Raj A
   */
  const getRecentCampaign = (ctx, campaignLinkMetrics, getRecentCampaignCB) => {
    EmailLink.app.models.campaign.find({
      where: {
        "createdBy": ctx.req.accessToken.userId
      },
      order: "lastrunat DESC",
      limit: 1
    }, (campaignFindErr, campaigns) => {
      if(campaignFindErr || !campaigns.length){
        logger.error("Error while finding campaign:",
        {ctx:ctx.req.accessToken.userId, error: campaignFindErr,
          stack: campaignFindErr.stack});
        return getRecentCampaignCB(campaignFindErr);
      }
      return getRecentCampaignCB(null, campaigns[0]);
    });
  };

  /**
   * For process getRecentCampaignLinkMetrics:
   * - Get all the email Links for the current campaign
   * @param  {[campaign]} campaign
   * @param  {[campaignLinkMetrics]} campaignLinkMetrics
   * @param  {[function]} getEmailLinksForCampaignCB
   * @return {[emailLinks, campaign]}
   * @author Aswin Raj A
   */
  const getEmailLinksForCampaign = (campaign, getEmailLinksForCampaignCB) => {
    EmailLink.find({
      where: {
        campaignId: campaign.id
      }
    }, (emailLinkfinderr, emailLinks) => {
      if(emailLinkfinderr || !emailLinks.length){
        logger.error("Error while finding emailLinks for campaign:",
        {campaign:campaign, error: emailLinkfinderr,
          stack: emailLinkfinderr.stack});
        return getEmailLinksForCampaignCB(emailLinkfinderr);
      }
      return getEmailLinksForCampaignCB(null, emailLinks, campaign);
    });
  };


  /**
   * For process getRecentCampaignLinkMetrics:
   * - Get the clicked count for all the links for the recent campaign
   * @param  {[emailLinks]} emailLinks
   * @param  {[campaign]} campaign
   * @param  {[campaignLinkMetrics]} campaignLinkMetrics
   * @param  {[function]} getClickedCountForEmailLinksCB
   * @return {[campaignLinkMetrics]}
   * @author Aswin Raj A
   */
  const getClickedCountForEmailLinks = (emailLinks, campaign,
     getClickedCountForEmailLinksCB) => {
    let campaignLinkMetrics = [];
    async.each(emailLinks, (emailLink, asyncEmailLinkCB) => {
      EmailLink.app.models.clickedEmailLink.find({
        where: {
          and: [{
            emailLinkId: emailLink.id
          }, {
            campaignId: campaign.id
          }]
        }
      }, (clickedEmailLinkFindErr, clickedEmailLinks) => {
        if(clickedEmailLinkFindErr || !clickedEmailLinks.length){
          logger.error("Error while finding clickedEmailLinks:",
          {emailLinks:emailLinks, campaign:campaign,
            error: clickedEmailLinkFindErr,
            stack: clickedEmailLinkFindErr.stack});
          asyncEmailLinkCB(clickedEmailLinkFindErr);
        }
        campaignLinkMetrics.push({
          "link" : emailLink.linkurl,
          "uniqueueClickCount": emailLink.clickedCount,
          "totalClickCount": clickedEmailLinks.length
        });
        asyncEmailLinkCB(null);
      });
    }, (asyncErr) => {
      if (asyncErr) {
        logger.error("Error on getting clickedCount for emailLink:",
        {error: asyncErr, stack: asyncErr.stack});
        return getClickedCountForEmailLinksCB(asyncErr);
      }
      return getClickedCountForEmailLinksCB(null, campaignLinkMetrics);
    });
  };



  EmailLink.remoteMethod(
    "getCurrentCampaignLinkMetrics", {
      description: "Get clicked link metrics for current campaign",
      accepts: [{arg: "campaignId", type: "any"}],
      returns: {arg: "currentCampaignLinkMetrics", type: "object"},
      http: {
        verb: "get",
        path: "/campaign/:campaignId/getCurrentCampaignLinkMetrics/"
      }
    }
  );

  /**
   * Get the link metrics for the current campaign
   * @param  {[campaignId]} campaignId
   * @param  {[function]} getCurrentCampaignLinkMetricsCB
   * @return {[currentCampaignLinkMetrics]}
   * @author Aswin Raj A
   */
  EmailLink.getCurrentCampaignLinkMetrics = (campaignId,
    getCurrentCampaignLinkMetricsCB) => {
    let currentCampaignLinkMetrics = [];
    async.waterfall([
      async.apply(getEmailLinksForCurrentCampaign, campaignId,
        currentCampaignLinkMetrics),
      getClickedCountForCurrentCampaignLinks
    ], (asyncErr, campaignLinkMetrics) => {
      if (asyncErr) {
        logger.error("Error on getting clickedCount for emailLink:",
        {error: asyncErr, stack: asyncErr.stack});
        return getCurrentCampaignLinkMetricsCB(asyncErr);
      }
      return getCurrentCampaignLinkMetricsCB(null, currentCampaignLinkMetrics);
    });
  };


  /**
   * For process getCurrentCampaignLinkMetrics:
   * - Get all the email Links for the current campaign
   * @param  {[campaignId]} campaignId
   * @param  {[campaignLinkMetrics]} campaignLinkMetrics
   * @param  {[function]} getEmailLinksForCampaignCB
   * @return {[emailLinks, campaignId]}
   * @author Aswin Raj A
   */
  const getEmailLinksForCurrentCampaign = (campaignId,
    currentCampaignLinkMetrics,
     getEmailLinksForCurrentCampaignCB) => {
    EmailLink.find({
      where: {
        campaignId: campaignId
      }
    }, (emailLinkfinderr, emailLinks) => {
      if(emailLinkfinderr){
        logger.error("Error while finding emailLinks for campaign:",
        {campaignId:campaignId, error: emailLinkfinderr,
          stack: emailLinkfinderr.stack});
        return getEmailLinksForCurrentCampaignCB(emailLinkfinderr);
      }
      return getEmailLinksForCurrentCampaignCB(null, emailLinks, campaignId,
        currentCampaignLinkMetrics);
    });
  };

  /**
   * For process getCurrentCampaignLinkMetrics:
   * - Get the clicked count for all the links for the current campaign
   * @param  {[emailLinks]} emailLinks
   * @param  {[campaignId]} campaignId
   * @param  {[currentCampaignLinkMetrics]} currentCampaignLinkMetrics
   * @param  {[function]} getClickedCountForCurrentCampaignLinksCB
   * @return {[currentCampaignLinkMetrics]}
   * @author Aswin Raj A
   */
  const getClickedCountForCurrentCampaignLinks = (emailLinks, campaignId,
    currentCampaignLinkMetrics, getClickedCountForCurrentCampaignLinksCB) => {
    async.each(emailLinks, (emailLink, asyncEmailLinkCB) => {
      EmailLink.app.models.clickedEmailLink.find({
        where: {
          and: [{
            emailLinkId: emailLink.id
          }, {
            campaignId: campaignId
          }]
        }
      }, (clickedEmailLinkFindErr, clickedEmailLinks) => {
        if(clickedEmailLinkFindErr){
          logger.error("Error while finding clickedEmailLinks:",
          {emailLinkid:emailLink.id, campaignId:campaignId,
            error: clickedEmailLinkFindErr,
            stack: clickedEmailLinkFindErr.stack});
          asyncEmailLinkCB(clickedEmailLinkFindErr);
        }
        currentCampaignLinkMetrics.push({
          "link" : emailLink.linkurl,
          "uniqueueClickCount": emailLink.clickedCount,
          "totalClickCount": clickedEmailLinks.length
        });
        asyncEmailLinkCB(null);
      });
    }, (asyncErr) => {
      if (asyncErr) {
        logger.error("Error on getting clickedCount for emailLink:",
        {error: asyncErr, stack: asyncErr.stack});
        return getClickedCountForCurrentCampaignLinksCB(asyncErr);
      }
      return getClickedCountForCurrentCampaignLinksCB(null,
        currentCampaignLinkMetrics);
    });
  };



  //npm run methods
  EmailLink.getOrSave = (campaign, link, getOrSaveCB) => {
    EmailLink.find({where: {and: [{campaignId: campaign.id},
      {linkurl: link}]}}, (emailLinkExistsFindErr, emailLinks)=>{
      if(emailLinkExistsFindErr) {
        logger.error("Check link Exists in emailLinks Find Error", {
          error: emailLinkExistsFindErr,
          campaign: campaign,
          link: link
        });
        return getOrSaveCB(emailLinkExistsFindErr);
      }
      if(lodash.isEmpty(emailLinks)) {
        EmailLink.create({linkurl: link, clickedCount: 0,
           campaignId: campaign.id
        }, (emailLinkEntryDataErr, emailLink) => {
            if(emailLinkEntryDataErr) {
              logger.error("Check link Exists in emailLinks Find Error", {
                error: emailLinkEntryDataErr,
                campaign: campaign,
                link: link
              });
              return getOrSaveCB(emailLinkExistsFindErr);
            }
            return getOrSaveCB(null, emailLink);
        });
      } else{
        return getOrSaveCB(null, emailLinks[0]);
      }
    }); //EmailQueue.find
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  EmailLink.observe("before save", (ctx, next) => {
    if(ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else{
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
