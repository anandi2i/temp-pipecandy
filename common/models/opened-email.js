import async from "async";
var emptyArrayLength = 0;

module.exports = function(OpenedEmail) {

  /**
   * API to track whether the campaign email has been opened by the prospect
   * http://localhost:3000/api/openedEmails/trackEmail?campaignId=1&personId=2&listId=1
   * @param  campaignId
   * @param  personId
   * @param  listId
   * @param  trackEmailCB (Callback)
   * @return void
   */
  OpenedEmail.trackEmail = function(campaignId, personId, listId,
    trackEmailCB) {

    OpenedEmail.find({
      where: {
        "campaignId": campaignId,
        "personId": personId
      }
    }, function(err, openedEmailEntry) {
      if (err) {
        trackEmailCB(err);
      }

      if (openedEmailEntry.length > emptyArrayLength) {

        OpenedEmail.updateAll({
          "campaignId": campaignId,
          "personId": personId
        }, {
          "count": ++openedEmailEntry[0].count
        }, function(err, updatedopenedEmailEntry) {
          if (err) {
            trackEmailCB(err);
          }
          trackEmailCB(null);
        });


      } else {

        async.series([
          openedEmailsEntry,
          listMetricEntry,
          campaignMetricEntry
        ], function(err, results) {
          if (err) {
            trackEmailCB(err);
          }
          trackEmailCB(null);
        });

      }

      /**
       * Placing an entry in openedEmails Table when a prospect opens it
       * @param  openedEmailsEntryCB (Callback)
       * @return void
       */
      function openedEmailsEntry(openedEmailsEntryCB) {
        OpenedEmail.create({
          "campaignId": campaignId,
          "personId": personId,
          "count": 1
        }, function(err, openedEmailNewEntry) {
          if (err) {
            openedEmailsEntryCB(err);
          }
          openedEmailsEntryCB(null);
        });
      }

      /**
       * Increment the "opened" column in listMetric when a prospect clicks on
       * it
       * @param  listMetricEntryCB (Callback)
       * @return void
       */
      function listMetricEntry(listMetricEntryCB) {

        OpenedEmail.app.models.listMetric.find({
          where: {
            "campaignId": campaignId,
            "listId": listId
          }
        }, function(err, listMetricEntry) {

          if (err) {
            listMetricEntryCB(err);
          }

          if (listMetricEntry.length > emptyArrayLength) {
            OpenedEmail.app.models.listMetric.updateAll({
              "campaignId": campaignId,
              "listId": listId
            }, {
              "opened": ++listMetricEntry[0].opened
            }, function(err, updatedListMetricEntry) {
              if (err) {
                listMetricEntryCB(err);
              }
              listMetricEntryCB(null);
            });

          } else {
            OpenedEmail.app.models.listMetric.create({
              "campaignId": campaignId,
              "listId": listId,
              "opened": 1
            }, function(err, newlistMetricEntry) {
              if (err) {
                listMetricEntryCB(err);
              }
              listMetricEntryCB(null);
            });
          }

        });

      }

      /**
       * Increment the "opened" column in campaignMetric when a prospect clicks
       * on it
       * @param  campaignMetricEntryCB (Callback)
       * @return void
       */
      function campaignMetricEntry(campaignMetricEntryCB) {

        OpenedEmail.app.models.campaignMetric.find({
          where: {
            "campaignId": campaignId,
          }
        }, function(err, campaignMetricEntry) {
          if (err) {
            campaignMetricEntryCB(err);
          }
          if (campaignMetricEntry.length > emptyArrayLength) {

            OpenedEmail.app.models.campaignMetric.updateAll({
              "campaignId": campaignId,
            }, {
              "opened": ++campaignMetricEntry[0].opened
            }, function(err, updatedListMetricEntry) {
              if (err) {
                campaignMetricEntryCB(err);
              }
              campaignMetricEntryCB(null);
            });

          } else {

            OpenedEmail.app.models.campaignMetric.create({
              "campaignId": campaignId,
              "opened": 1
            }, function(err, newcampaignMetricEntry) {
              if (err) {
                campaignMetricEntryCB(err);
              }
              campaignMetricEntryCB(null);
            });

          }
        });

      }

    });

  };


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
      }, {
        arg: "listId",
        type: "number"
      }],
      returns: {
        arg: "results",
        type: "string"
      },
      http: {
        path: "/trackEmail",
        verb: "GET"
      }
    }
  );

};
