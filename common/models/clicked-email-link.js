import async from "async";
const emptyArrayLength = 0;
const firstClick = 1;

module.exports = function(ClickedEmailLink) {

  /**
   * Tracks the email links in the campaign mail when it is clicked.
   * TODO Move out the async methods definition outside the function block
   * http://localhost:3001/api/clickedEmailLinks/track/:campaign/:person/:emailLinkId/track.png
   * @param  {[number]} campaignId
   * @param  {[number]} personId
   * @param  {[number]} emailLinkId
   * @param  emailLinkTrackCB   (Callback)
   * @author Aswin Raj A
   * @return void
   */

  ClickedEmailLink.track = (campaignId, personId, emailLinkId,
    clickedEmailLinkTrackCB) => {
    ClickedEmailLink.find({
      where: {
        "campaignId": campaignId,
        "personId": personId,
        "emailLinkId": emailLinkId
      }
    }, (ClickedEmailLinkEntryErr, ClickedEmailLinkEntry) => {
      if(ClickedEmailLinkEntryErr) {
        clickedEmailLinkTrackCB(ClickedEmailLinkEntryErr);
      }
      if(ClickedEmailLinkEntry.length > emptyArrayLength) {
        async.each(ClickedEmailLinkEntry,
          (ClickedEmailLinkEntryData, ClickedEmailLinkEntryCB) => {
          ClickedEmailLinkEntryData.updateAttributes(
            {"count": ++ClickedEmailLinkEntryData.count},
            (updatedClickedEmailLinkErr, updatedClickedEmailLinkEntry) => {
              if(updatedClickedEmailLinkErr){
                ClickedEmailLinkEntryCB(updatedClickedEmailLinkErr);
              }
              ClickedEmailLinkEntryCB(null);
            });
        });
        clickedEmailLinkTrackCB(null, "Already exisits");
      } else{

        /**
         * Make an entry in clickedEmailLink table if there is no record for
         * current campaignId, personId and emailLinkId
         * @param  clickedEmailLinkEntryCB (Callback)
         * @return void
         */

        let clickedEmailLinkEntry =
        (emailLinkId, campaignId, personId, clickedEmailLinkEntryCB) => {
          let clickedEmailLinkObj = {
            "emailLinkId": emailLinkId,
            "campaignId": campaignId,
            "personId": personId,
            "count": firstClick
          };
          ClickedEmailLink.create(clickedEmailLinkObj,
            (clickedEmailLinkEntryDataErr, clickedEmailLinkEntryData) => {
              if(clickedEmailLinkEntryDataErr) {
                clickedEmailLinkEntryCB(clickedEmailLinkEntryDataErr);
              }
              clickedEmailLinkEntryCB(null);
            });
        };


        /**
         * Increment the clicked count for the current campaignId in emailLink
         * table
         * @param  emailLinkEntryCB (Callback)
         * @return void
         */

        let emailLinkEntry = (emailLinkEntryCB) => {
          ClickedEmailLink.app.models.emailLink.findById(emailLinkId,
            (emailLinkEntryErr, emailLinkEntry) => {
              if(emailLinkEntryErr) {
                emailLinkEntryCB(emailLinkEntryErr);
              }
              emailLinkEntry.updateAttribute("clickedCount",
                ++emailLinkEntry.clickedCount,
                (updatedEmailLinkEntryErr, updatedEmailLinkEntry) => {
                  if(updatedEmailLinkEntryErr) {
                    emailLinkEntryCB(updatedEmailLinkEntryErr);
                  }
                  emailLinkEntryCB(null);
                });
            });
        };

        /**
         * Place an new entry in listMetric Table if there is no record for the
         * current campaignId
         * If there is any record, update the click count by 1 for the current
         * campaignId
         * @param  listMetricEntryCB (Callback)
         * @return void
         */

        let listMetricEntry = (listMetricEntryCB) => {
          ClickedEmailLink.app.models.listMetric.find({
            where: {
              "campaignId": campaignId
            }
          }, (listMetricEntryErr, listMetricEntry) => {
            if(listMetricEntryErr) {
              listMetricEntryCB(listMetricEntryErr);
            }
            if(listMetricEntry.length > emptyArrayLength) {
              ClickedEmailLink.app.models.listMetric.updateAll({
                "campaignId": campaignId
              }, {
                "clicked": ++listMetricEntry[0].clicked
              }, (updatedListMetricEntryErr, updatedListMetricEntry) => {
                if(updatedListMetricEntryErr) {
                  listMetricEntryCB(updatedListMetricEntryErr);
                }
                listMetricEntryCB(null);
              });
            } else{
              ClickedEmailLink.app.models.listMetric.create({
                "clicked": 1,
                "campaignId": campaignId
              }, (listMetricEntryErr, listMetricEntry) => {
                if(listMetricEntryErr) {
                  listMetricEntryCB(listMetricEntryErr);
                }
                listMetricEntryCB(null);
              });
            }

          });
        };

        /**
         * Place an new entry in campaignMetric Table if there is no record for
         * the current campaignId
         * If there is any record, update the click count by 1 for the current
         * campaignId
         * @param  campaignMetricEntryCB (Callback)
         * @return void
         */
        let campaignMetricEntry = (campaignMetricEntryCB) => {
          ClickedEmailLink.app.models.campaignMetric.find({
            where: {
              "campaignId": campaignId
            }
          }, (campaignMetricEntryErr, campaignMetricEntry) => {

            if(campaignMetricEntryErr) {
              campaignMetricEntryCB(campaignMetricEntryErr);
            }

            if(campaignMetricEntry.length > emptyArrayLength) {
              ClickedEmailLink.app.models.campaignMetric.updateAll({
                "campaignId": campaignId
              }, {
                "clicked": ++campaignMetricEntry[0].clicked
              },
              (updatedCampaignMetricEntryErr, updatedCampaignMetricEntry) => {
                if(updatedCampaignMetricEntryErr) {
                  campaignMetricEntryCB(updatedCampaignMetricEntryErr);
                }
                campaignMetricEntryCB(null);
              });
            } else{
              ClickedEmailLink.app.models.campaignMetric.create({
                "clicked": 1,
                "campaignId": campaignId
              }, (campaignMetricEntryErr, campaignMetricEntry) => {
                if(campaignMetricEntryErr) {
                  campaignMetricEntryCB(campaignMetricEntryErr);
                }
                campaignMetricEntryCB(null);
              });
            }
          });
        };

        async.waterfall([
          function(setArgs) {
            setArgs(null, emailLinkId, campaignId, personId);
          },
          clickedEmailLinkEntry,
          emailLinkEntry,
          listMetricEntry,
          campaignMetricEntry
        ], (asyncErr, results) => {
          if(asyncErr) {
            clickedEmailLinkTrackCB(asyncErr);
          }
          clickedEmailLinkTrackCB(null, "Success");
        });

      }
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  ClickedEmailLink.observe("before save", (ctx, next) => {
    if(ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else{
      ctx.data.updatedAt = new Date();
    }
    next();
  });

  ClickedEmailLink.remoteMethod(
    "track", {
      accepts: [{
        arg: "campaignId",
        type: "number"
      }, {
        arg: "personId",
        type: "number"
      }, {
        arg: "emailLinkId",
        type: "number"
      }],
      returns: {
        arg: "result",
        type: "string"
      },
      http: {
      path: "/:emailLinkId/campaign/:campaignId/person/:personId/track",
      verb: "GET"
      }
    }
  );


  ClickedEmailLink.remoteMethod(
    "sample", {
      accepts: [{
        arg: "campaignId",
        type: "number"
      }],
      returns: {
        arg: "result",
        type: "string"
      },
      http: {
        path: "/sample/:campaignId",
        verb: "GET"
      }
    }
  );

};
