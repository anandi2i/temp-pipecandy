import async from "async";
import lodash from "lodash";
import logger from "../../server/log";
import config from "../../server/config.json";

module.exports = function(OpenedEmail) {

  OpenedEmail.remoteMethod(
    "trackEmail", {
      accepts: [
        {arg: "campaignId", type: "number"},
        {arg: "personId", type: "number"},
        {arg: "res", type: "object", "http": {source: "res"}},
        {arg: "req", type: "object", "http": {source: "req"}}
      ],
      http:
        {path: "/campaign/:campaignId/person/:personId/trackEmail", verb: "GET"}
    }
  );
  /**
   * API to track whether the campaign email has been opened by the prospect
   * http://localhost:3000/api/openedEmails/trackEmail/:campaignId/:personId/track.png
   * @param  {[number]} campaignId
   * @param  {[number]} personId
   * @param  trackEmailCB (Callback)
   * @return void
   */
  OpenedEmail.trackEmail = (campaignId, personId, res, req) => {
    if(req.headers.host === config.emailHost) {
      return res.redirect("/images/1x1.png");
    }
    OpenedEmail.find({
      where: {
        "campaignId": campaignId,
        "personId": personId,
        "followUpId": null
      }
    }, (openedEmailEntryErr, openedEmailEntry) => {
      if(openedEmailEntryErr){
        logger.error("Error while finding open email entry", {
          input: {
            "campaignId": campaignId, "personId": personId
          }, error: openedEmailEntryErr, stack: openedEmailEntryErr.stack});
        return res.redirect("/images/1x1.png");
      }
      if(lodash.isEmpty(openedEmailEntry)) {
        async.waterfall([
          async.apply(openedEmailsEntry, campaignId, personId),
          listMetricEntry,
          campaignMetricEntry
        ], (asyncErr, results) => {
          if (asyncErr) {
            logger.error({error: asyncErr, stack: asyncErr});
            return res.redirect("/images/1x1.png");
          }
          return res.redirect("/images/1x1.png");
        });
      } else {
        OpenedEmail.create({
          "campaignId": campaignId, "personId": personId, "count": 1
        }, (openedEmailNewEntryErr, openedEmailNewEntry) => {
          if (openedEmailNewEntryErr) {
            logger.error("Error while creating open email entry", {
              input: {"campaignId": campaignId, "personId": personId
              }, error: openedEmailNewEntryErr,
              stack: openedEmailNewEntryErr.stack});
            return res.redirect("/images/1x1.png");
          }
          return res.redirect("/images/1x1.png");
        });
      }
    });
  };

  OpenedEmail.remoteMethod(
    "trackFollowUp", {
      accepts: [
        {arg: "campaignId", type: "number"},
        {arg: "personId", type: "number"},
        {arg: "followUpId", type: "number"},
        {arg: "res", type: "object", "http": {source: "res"}},
        {arg: "req", type: "object", "http": {source: "req"}}
      ],
      http:
        {path: "/campaign/:campaignId/person/:personId/followUp/:followUpId/"
            + "trackFollowUp", verb: "GET"}
    }
  );
  /**
   * API to track whether the follow email has been opened by the prospect
   * http://localhost:3000/api/openedEmails/trackEmail/:campaignId/:personId/followUp/:followUpId/trackFollowUp
   * @param  {[number]} campaignId
   * @param  {[number]} personId
   * @param  {[number]} followUpId
   * @param  trackEmailCB (Callback)
   * @return void
   */
  OpenedEmail.trackFollowUp = (campaignId, personId, followUpId, res, req) => {
    if(req.headers.host === config.emailHost) {
      return res.redirect("/images/1x1.png");
    }
    OpenedEmail.find({
      where: {
        "campaignId": campaignId,
        "personId": personId,
        "followUpId": followUpId
      }
    }, (openedEmailEntryErr, openedEmailEntry) => {
      if(openedEmailEntryErr){
        logger.error("Error while finding open email entry", {
          input: {"campaignId": campaignId, "personId": personId,
          "followUpId": followUpId}, error: openedEmailEntryErr,
          stack: openedEmailEntryErr.stack});
        return res.redirect("/images/1x1.png");
      }
      if(lodash.isEmpty(openedEmailEntry)) {
        async.series({
          openedEmail: async.apply(openedFollowUpEntry,
              campaignId, personId, followUpId),
          followUpMetric: async.apply(createFollowUpMetric,
              campaignId, followUpId)
        }, (asyncErr, results) => {
          if (asyncErr) {
            logger.error({error: asyncErr, stack: asyncErr});
            return res.redirect("/images/1x1.png");
          }
          return res.redirect("/images/1x1.png");
        });
      } else {
        openedFollowUpEntry(campaignId, personId, followUpId,
            (err, openedEmail) => {
          return res.redirect("/images/1x1.png");
        });
      }
    });
  };

  /**
   * - Process 1 of trackEmail - New entry
   * - Create an entry in the openedEmail table when a new person opens the email
   * @param  {[campaignId]} campaignId
   * @param  {[personId]} personId
   * @param  {[function]} openedEmailsEntryCB
   * @return {[campaignId, personId]}
   * @author Aswin Raj A
   */
  const openedEmailsEntry = (campaignId, personId, openedEmailsEntryCB) => {
    OpenedEmail.create({
      "campaignId": campaignId, "personId": personId, "count": 1
    }, (openedEmailNewEntryErr, openedEmailNewEntry) => {
      if (openedEmailNewEntryErr) {
        return openedEmailsEntryCB(openedEmailNewEntryErr);
      }
      return openedEmailsEntryCB(null, campaignId, personId);
    });
  };

  /**
   * - Create an entry in the openedEmail table when a person opens the followUp Email
   *
   * @param  {campaignId} campaignId
   * @param  {personId} personId
   * @param  {followUp} followUpId
   * @param  {function} callback
   * @return {OpenedEmail}
   * @author Syed Sulaiman M
   */
  const openedFollowUpEntry = (campaignId, personId, followUpId, callback) => {
    OpenedEmail.create({
      "campaignId": campaignId,
      "personId": personId,
      "followUpId": followUpId,
      "count": 1
    }, (openedEmailErr, openedEmail) => {
      if (openedEmailErr) {
        logger.error("Error while creating open followUp entry", {
          input: {"campaignId": campaignId, "personId": personId,
          "followUpId": followUpId}, error: openedEmailErr,
          stack: openedEmailErr.stack});
        return callback(openedEmailErr);
      }
      return callback(null, openedEmail);
    });
  };

  /**
   * Process 2 of trackEmail - New entry
   * Place an entry in the list metrics table for each campaign list for person
   * @param  {[campaignId]} campaignId
   * @param  {[personId]} personId
   * @param  {[function]} listMetricEntryCB
   * @return {[campaignId]}
   * @author Aswin Raj A
   */
  const listMetricEntry = (campaignId, personId, listMetricEntryCB) => {
    async.waterfall([
      async.apply(OpenedEmail.app.models.campaign
        .getCampaignListForPerson, campaignId, personId),
      updateOrCreatListMetrics
    ], (asyncErr, result) => {
      if(asyncErr){
        logger.error(asyncErr);
        return listMetricEntryCB(asyncErr);
      }
      return listMetricEntryCB(null, campaignId);
    });
  };




  /**
   * Process 2 of listMetricEntry
   * - After getting all the campaign list for person, for each list create
   *   an entry in the list metrics Table
   * - If already an entry exist, then update it.
   * @param  {[type]} campaignLists              [description]
   * @param  {[type]} campaignId                 [description]
   * @param  {[type]} personId                   [description]
   * @param  {[type]} updateOrCreatListMetricsCB [description]
   * @return {[type]}                            [description]
   * @author Aswin Raj A
   */
  const updateOrCreatListMetrics = (campaignLists, campaignId, personId,
    updateOrCreatListMetricsCB) => {
    async.eachSeries(campaignLists, (campaignList, eachCB) => {
      OpenedEmail.app.models.listMetric.find({
        where: {and: [{campaignId: campaignId}, {listId: campaignList.id}]}
      }, (metricFindErr, listMetrics) => {
        if(metricFindErr){
          logger.error("Error while finding listMetric", {
            input: {campaignId: campaignId, listId: campaignList.id},
            error: metricFindErr,
            stack: metricFindErr.stack
          });
          return eachCB(metricFindErr);
        }
        if(lodash.isEmpty(listMetrics)){
          OpenedEmail.app.models.listMetric.create({
            "campaignId": campaignId,
            "listId": campaignList.id,
            "opened": 1
          }, (createErr, campaign) => {
            if(createErr){
              logger.error("Error while creating listMetric", {
                input: {campaignId: campaignId, listId: campaignList.id},
                error: createErr, stack: createErr.stack});
              return eachCB(createErr);
            }
            return eachCB(null);
          });
        } else {
          listMetrics[0].updateAttribute("opened", ++listMetrics[0].opened,
          (listUpdateErr, listMetric) => {
            if(listUpdateErr) {
              logger.error("Error while updating list metrics", {
                input: {"campaignId": campaignId, "listId": campaignList.id},
                error: listUpdateErr, stack: listUpdateErr.stack
              });
              return eachCB(createErr);
            }
            return eachCB(null);
          });
        }
      });
    }, (listEntryErr) => {
      if(listEntryErr){
        logger.error(listEntryErr);
        return updateOrCreatListMetricsCB(listEntryErr);
      }
      return updateOrCreatListMetricsCB(null);
    });
  };

  /**
   * Process 3 of trackEmail - New entry
   * Create an entry in the campaign metrics table
   * - If already an entry found, update it
   * @param  {[campaignId]} campaignId
   * @param  {[function]} campaignMetricEntryCB
   * @return {[type]}
   * @author Aswin Raj A
   */
  const campaignMetricEntry = (campaignId, campaignMetricEntryCB) => {
    OpenedEmail.app.models.campaignMetric.find({
      where: {"campaignId": campaignId}
    }, (metricFindErr, campaignMetricEntry) => {
      if (metricFindErr) {
        logger.error("Error while finding campaign", {
          input: {"campaignId": campaignId},
          error: metricFindErr, stack: metricFindErr.stack
        });
        return campaignMetricEntryCB(metricFindErr);
      }
      if(lodash.isEmpty(campaignMetricEntry)) {
        OpenedEmail.app.models.campaignMetric.create({
          "campaignId": campaignId,
          "opened": 1
        }, (metricCreateErr, newcampaignMetricEntry) => {
          if (metricCreateErr) {
            logger.error("Error while creating campaign metrics", {
              input: {"campaignId": campaignId},
              error: metricCreateErr,
              stack: metricCreateErr.stack
            });
            return campaignMetricEntryCB(metricCreateErr);
          }
          return campaignMetricEntryCB(null);
        });
      } else {
        campaignMetricEntry[0].updateAttribute("opened",
        ++campaignMetricEntry[0].opened,
        (metricUpdateErr, updatedListMetricEntry) => {
          if (metricUpdateErr) {
            logger.error("Error while updating campaign metrics", {
              input: {"campaignId": campaignId},
              error: metricUpdateErr,
              stack: metricUpdateErr.stack
            });
            return campaignMetricEntryCB(metricUpdateErr);
          }
          return campaignMetricEntryCB(null);
        });
      }
    });
  };

  /**
   * Create an entry in the followUp Metric table
   *
   * @param  {Number} campaignId
   * @param  {Function} callback
   * @return {[type]}
   * @author Syed Sulaiman M
   */
  const createFollowUpMetric = (campaignId, followUpId, callback) => {
    OpenedEmail.app.models.followUpMetric.find({
      where: {
        "followUpId": followUpId,
        "campaignId": campaignId
      }
    }, (metricErr, metricEntry) => {
      if (metricErr) {
        logger.error("Error while finding FollowUp Metric", {
          input: {"followUpId": followUpId, "campaignId": campaignId},
          error: metricErr, stack: metricErr.stack
        });
        return callback(metricErr);
      }
      let followUpMetricInst = {
        campaignId: campaignId,
        followUpId: followUpId,
        opened: 1
      };
      if (!lodash.isEmpty(metricEntry)) {
        followUpMetricInst = metricEntry[0];
        followUpMetricInst.opened = ++metricEntry[0].opened;
      }
      OpenedEmail.app.models.followUpMetric.upsert(
          followUpMetricInst, function(err, response) {
        if (err) {
          logger.error("Error while create/update FollowUp Metric", {
            input: {"followUpId": followUpId, "campaignId": campaignId},
            error: err, stack: err.stack
          });
          return callback(err);
        }
        return callback(null, response);
      });
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  OpenedEmail.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

  OpenedEmail.remoteMethod(
    "trackEmail", {
      accepts: [{
        arg: "campaignId",
        type: "number"
      }, {
        arg: "personId",
        type: "number"
      }],
      returns: {
        arg: "results",
        type: "string"
      },
      http: {
        path: "/trackEmail/:campaignId/:personId/track.png",
        verb: "GET"
      }
    }
  );

};
