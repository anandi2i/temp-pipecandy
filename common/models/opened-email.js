import async from "async";
var emptyArrayLength = 0;

module.exports = function(OpenedEmail) {

  /**
   * API to track whether the campaign email has been opened by the prospect
   * http://localhost:3000/api/openedEmails/trackEmail/:campaignId/:personId/track.png
   * @param  {[number]} campaignId
   * @param  {[number]} personId
   * @param  trackEmailCB (Callback)
   * @return void
   */
  OpenedEmail.trackEmail = (campaignId, personId, trackEmailCB) => {
    OpenedEmail.find({
      where: {
        "campaignId": campaignId,
        "personId": personId
      }
    }, (openedEmailEntryErr, openedEmailEntry) => {
      if (openedEmailEntryErr) {
        trackEmailCB(openedEmailEntryErr);
      }

      if (openedEmailEntry.length > emptyArrayLength) {

        OpenedEmail.updateAll({
          "campaignId": campaignId,
          "personId": personId
        }, {
          "count": ++openedEmailEntry[0].count
        }, (updatedopenedEmailEntryErr, updatedopenedEmailEntry) => {
          if (updatedopenedEmailEntryErr) {
            trackEmailCB(updatedopenedEmailEntryErr);
          }
          trackEmailCB(null);
        });


      } else {

        async.series([
          openedEmailsEntry,
          listMetricEntry,
          campaignMetricEntry
        ], (asyncErr, results) => {
          if (asyncErr) {
            trackEmailCB(asyncErr);
          }
          trackEmailCB(null);
        });

      }

    });




  /**
   * Placing an entry in openedEmails Table when a prospect opens it
   * @param  openedEmailsEntryCB (Callback)
   * @return void
   */
  let openedEmailsEntry = (openedEmailsEntryCB) => {
    OpenedEmail.create({
      "campaignId": campaignId,
      "personId": personId,
      "count": 1
    }, function(openedEmailNewEntryErr, openedEmailNewEntry) {
      if (openedEmailNewEntryErr) {
        openedEmailsEntryCB(openedEmailNewEntryErr);
      }
      openedEmailsEntryCB(null);
    });
  };

  /**
   * Increment the "opened" column in listMetric when a prospect clicks on
   * it
   * @param  listMetricEntryCB (Callback)
   * @return void
   */
  let listMetricEntry = (listMetricEntryCB) => {
    OpenedEmail.app.models.campaign.findById(campaignId,
            (campaignErr, campaign) => {
      campaign.lists( (listsErr, lists) => {
        async.each(lists, (list, listCB) => {
          OpenedEmail.app.models.listMetric.find({
            where: {
              "campaignId": campaignId,
              "listId": list.id
            }
          }, function(listMetricEntryErr, listMetricEntry) {
            if (listMetricEntryErr) {
              return listCB(listMetricEntryErr);
            }
            if (listMetricEntry.length > emptyArrayLength) {
              OpenedEmail.app.models.listMetric.updateAll({
                "campaignId": campaignId,
                "listId": list.id
              }, {
                "opened": ++listMetricEntry[0].opened
              }, function(updatedListMetricEntryErr, updatedListMetricEntry) {
                if (updatedListMetricEntryErr) {
                  return listCB(updatedListMetricEntryErr);
                }
                listCB(null);
              });
            } else {
              const one = 1;
              OpenedEmail.app.models.listMetric.create({
                "campaignId": campaignId,
                "listId": list.id,
                "opened": one
              }, function(newlistMetricEntryErr, newlistMetricEntry) {
                if (newlistMetricEntryErr) {
                  return listCB(newlistMetricEntryErr);
                }
                listCB(null);
              });
            }
          });
        }, (listError) => {
          if(listError) return listMetricEntryCB(error);
          return listMetricEntryCB(null);
        });
      });
    });
  };

  /**
   * Increment the "opened" column in campaignMetric when a prospect clicks
   * on it
   * @param  campaignMetricEntryCB (Callback)
   * @return void
   */
  let campaignMetricEntry = (campaignMetricEntryCB) => {

    OpenedEmail.app.models.campaignMetric.find({
      where: {
        "campaignId": campaignId,
      }
    }, (campaignMetricEntryErr, campaignMetricEntry) => {
      if (campaignMetricEntryErr) {
        campaignMetricEntryCB(campaignMetricEntryErr);
      }
      if (campaignMetricEntry.length > emptyArrayLength) {

        OpenedEmail.app.models.campaignMetric.updateAll({
          "campaignId": campaignId,
        }, {
          "opened": ++campaignMetricEntry[0].opened
        }, (updatedListMetricEntryErr, updatedListMetricEntry) => {
          if (updatedListMetricEntryErr) {
            campaignMetricEntryCB(updatedListMetricEntryErr);
          }
          campaignMetricEntryCB(null);
        });

      } else {

        OpenedEmail.app.models.campaignMetric.create({
          "campaignId": campaignId,
          "opened": 1
        }, (newcampaignMetricEntryErr, newcampaignMetricEntry) => {
          if (newcampaignMetricEntryErr) {
            campaignMetricEntryCB(newcampaignMetricEntryErr);
          }
          campaignMetricEntryCB(null);
        });

      }
    });

  };

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
