import async from "async";

module.exports = function(ClickedEmailLink) {

  /**
   * Tracks the email links in the campaign mail when it is clicked.
   * http://localhost:3000/api/ClickedEmailLink/track?campaignId=1&personId=1&emailLinkId=1
   * @param  {[number]} campaignId       Campaign Id
   * @param  {[number]} personId         Person Id
   * @param  {[number]} emailLinkId      EmailLink Id
   * @param  {[function]} emailLinkTrackCB
   * @return void
   */
  ClickedEmailLink.track = (campaignId, personId, emailLinkId,
    clickedEmailLinkTrackCB) => {

    ClickedEmailLink.find({
      where: {
        campaignId,
        personId,
        emailLinkId
      }
    }, (err, ClickedEmailLinkEntry) => {
      if (err) {
        clickedEmailLinkTrackCB(err);
      }

      let emptyArrayLength = 0;
      if (ClickedEmailLinkEntry.length > emptyArrayLength) {
        clickedEmailLinkTrackCB(null, "Already exisits");
      } else {

        async.series([
          clickedEmailLinkEntry,
          emailLinkEntry,
          listMetricEntry,
          campaignMetricEntry
        ], (err, results) => {
          if (err) {
            console.log("async err: ", err);
            clickedEmailLinkTrackCB("async err");
          }
          clickedEmailLinkTrackCB("Success");
        });


        /**
         * Make an entry in clickedEmailLink table if there is no record for
         * current campaignId, personId and emailLinkId
         * @param  clickedEmailLinkEntryCB (Callback)
         * @return void
         */

        function clickedEmailLinkEntry(clickedEmailLinkEntryCB) {
          const clickedEmailLinkEntry = {
            emailLinkId,
            campaignId,
            personId
          };
          ClickedEmailLink.create(clickedEmailLinkEntry, (err,
            clickedEmailLinkEntryData) => {
            if (err) {
              clickedEmailLinkEntryCB("Error while creating ClickedEmailLink");
            }
            clickedEmailLinkEntryCB(null);
          });
        }


        /**
         * Increment the clicked count for the current campaignId in emailLink
         * table
         * @param  emailLinkEntryCB (Callback)
         * @return void
         */

        function emailLinkEntry(emailLinkEntryCB) {
          ClickedEmailLink.app.models.emailLink.findById(emailLinkId,
            (err, emailLinkEntry) => {
              if (err) {
                emailLinkEntryCB("Error while finding emailLink");
              }
              emailLinkEntry.updateAttribute("clickedCount",
                ++emailLinkEntry.clickedCount, (err, updatedEmailLinkEntry) => {
                  if (err) {
                    emailLinkEntryCB("Error while updating clickedCount");
                  }
                  emailLinkEntryCB(null);
                });
            });
        }


        /**
         * Place an new entry in listMetric Table if there is no record for the
         * current campaignId
         * If there is any record, update the click count by 1 for the current
         * campaignId
         * @param  listMetricEntryCB (Callback)
         * @return void
         */

        function listMetricEntry(listMetricEntryCB) {
          ClickedEmailLink.app.models.listMetric.find({
            where: {
              campaignId
            }
          }, (err, listMetricEntry) => {
            if (err) {
              listMetricEntryCB(err);
            }
            if (listMetricEntry.length > emptyArrayLength) {
              ClickedEmailLink.app.models.listMetric.updateAll({
                "campaignId": campaignId
              }, {
                "clicked": ++listMetricEntry[0].clicked
              }, (err, updatedListMetricEntry) => {
                if (err) {
                  listMetricEntryCB("Error while updating click in listMetric");
                }
                listMetricEntryCB(null);
              });
            } else {
              ClickedEmailLink.app.models.listMetric.create({
                "clicked": 1,
                "campaignId": campaignId
              }, (err, listMetricEntry) => {
                if (err) {
                  listMetricEntryCB("Error while creating click in listMetric");
                }
                listMetricEntryCB(null);
              });
            }
          });
        }

        /**
         * Place an new entry in campaignMetric Table if there is no record for
         * the current campaignId
         * If there is any record, update the click count by 1 for the current
         * campaignId
         * @param  campaignMetricEntryCB (Callback)
         * @return void
         */
        function campaignMetricEntry(campaignMetricEntryCB) {
          ClickedEmailLink.app.models.campaignMetric.find({
            where: {
              campaignId
            }
          }, (err, campaignMetricEntry) => {

            if (err) {
              campaignMetricEntryCB(err);
            }

            if (campaignMetricEntry.length > emptyArrayLength) {
              ClickedEmailLink.app.models.campaignMetric.updateAll({
                "campaignId": campaignId
              }, {
                "clicked": ++campaignMetricEntry[0].clicked
              }, (err, updatedCampaignMetricEntry) => {
                if (err) {
                  campaignMetricEntryCB("Update error in campaignMetric");
                }
                campaignMetricEntryCB(null);
              });
            } else {
              ClickedEmailLink.app.models.campaignMetric.create({
                "clicked": 1,
                "campaignId": campaignId
              }, (err, campaignMetricEntry) => {
                if (err) {
                  campaignMetricEntryCB("Update error in campaignMetric");
                }
                campaignMetricEntryCB(null);
              });
            }
          });
        }
      }

    });

  };


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
        path: "/track",
        verb: "GET"
      },
    }
  );

};
