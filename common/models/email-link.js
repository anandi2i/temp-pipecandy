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
        arg: 'res',
        type: 'object',
        'http': {
          source: 'res'
        }
      }, {
        arg: 'req',
        type: 'object',
        'http': {
          source: 'req'
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
        logger.error("Finding an Link Obj Error:", reqParams);
        return res.redirect(config.redirectURL);
      }
      if(req.headers.referer !== config.emailHost){
        isCampaignSent(reqParams.campaignId,
          (isCampaignSentErr, isCampaignSentResponse) => {
          if(isCampaignSentResponse){
            updateMetrics(reqParams, link, (updateMetricsErr) => {
              if(updateMetricsErr) {
                return res.redirect(config.redirectURL);
              }
            });
            res.redirect(link.linkurl);
          }
        });
      } else{
        res.redirect(link.linkurl);
      }
    });
  };

  let isCampaignSent = (campaignId, isCampaignSentCB) => {
    EmailLink.app.models.campaign.findById(campaignId,
      (campaignFindErr, campaign) => {
        if(campaignFindErr || !campaign){
          reqParams.error = campaignFindErr;
          logger.error("Error while finding campaign:", campaignFindErr);
          return isCampaignSentCB(campaignFindErr);
        }
        if(campaign.isSent){
          return isCampaignSentCB(null, true);
        }
        return isCampaignSentCB(null, false);
    });
  };


  let updateMetrics = (reqParams, link, updateMetricsCB) => {
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
        reqParams.error = clickedLinkErr;
        logger.error("Finding an LinkMetrics Obj Error:", reqParams);
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

  let updateAllLinkRelatedMetrics = (reqParams, updateAllRelatedMetricsCB) => {
    async.parallel({
      linkRelated: updatelinkAndLinkMetrics.bind(null, reqParams),
      campaignAndList: updateListAndCampaignMetrics.bind(null, reqParams)
    }, (parallelErr, results) => {
      if(parallelErr) {
        reqParams.error = linkFindErr;
        logger.error("On async.parallel updateAllRelatedMetrics", reqParams);
        return updateAllRelatedMetricsCB(parallelErr);
      }
      return updateAllRelatedMetricsCB(null);
    });
  };

  let updatelinkAndLinkMetrics = (reqParams, updatelinkAndLinkMetricsCB) => {
    async.parallel({
      clickedEmailLink: EmailLink.app.models.clickedEmailLink.addMetrics.bind(
        null, reqParams),
      link: addMetrics.bind(null, reqParams)
    }, (parallelErr, results) => {
      if(parallelErr) {
        reqParams.error = linkFindErr;
        logger.error("On async.parallel updatelinkAndLinkMetrics", reqParams);
        return updatelinkAndLinkMetricsCB(parallelErr);
      }
      return updatelinkAndLinkMetricsCB(null);
    });
  };

  let updateListAndCampaignMetrics = (reqParams, updateCounterCacheCB) => {
    async.parallel({
      campaign: EmailLink.app.models.campaignMetric.addMetrics.bind(null,
        reqParams, "Link"),
      lists: EmailLink.app.models.listMetric.addMetrics.bind(null,
        reqParams, "Link")
    }, (parallelErr, results) => {
      if(parallelErr) {
        reqParams.error = linkFindErr;
        logger.error("Error on async.parallel updateMetrics", reqParams);
        return updateCounterCacheCB(parallelErr);
      }
      return updateCounterCacheCB(null);
    });
  };

  let addMetrics = (reqParams, addEmailMetricsCB) => {
    EmailLink.findById(reqParams.emailLinkId,
      (emailLinkFindErr, emailLinkData) => {

      if(emailLinkFindErr || !emailLinkData){
        reqParams.error = emailLinkFindErr;
        logger.error("Error on updating emailLink", emailLinkFindErr);
        return addEmailMetricsCB(emailLinkFindErr);
      }
      emailLinkData.updateAttribute("clickedCount",
      ++emailLinkData.clickedCount,
       (emailLinkDataUpdateErr, updatedemailLink) => {
         if(emailLinkDataUpdateErr){
           reqParams.error = emailLinkDataUpdateErr;
           logger.error("Error on updating emailLink", emailLinkDataUpdateErr);
           return addEmailMetricsCB(emailLinkDataUpdateErr);
         }
         addEmailMetricsCB(null, "EmailLink updated");
      });

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
