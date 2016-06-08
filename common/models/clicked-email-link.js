import async from "async";
const emptyArrayLength = 0;

module.exports = function(ClickedEmailLink) {

  /**
   * Tracks the email links in the campaign mail when it is clicked.
   * http://localhost:3000/api/ClickedEmailLink/track?campaignId=1&personId=1&emailLinkId=1
   * @param  {[number]} campaignId         Campaign Id
   * @param  {[number]} personId           Person Id
   * @param  {[number]} emailLinkId        EmailLink Id
   * @param  {[number]} emailLinkTrackCB   (Callback)
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
      if (ClickedEmailLinkEntryErr) {
        clickedEmailLinkTrackCB(ClickedEmailLinkEntryErr);
      }

      if (ClickedEmailLinkEntry.length > emptyArrayLength) {
        clickedEmailLinkTrackCB(null, "Already exisits");
      } else {

        async.series([
          clickedEmailLinkEntry,
          emailLinkEntry,
          listMetricEntry,
          campaignMetricEntry
        ], (asyncErr, results) => {
          if (asyncErr) {
            clickedEmailLinkTrackCB("async err");
          }
          clickedEmailLinkTrackCB("Success");
        });

      }

    });

  };


  /**
   * Make an entry in clickedEmailLink table if there is no record for
   * current campaignId, personId and emailLinkId
   * @param  clickedEmailLinkEntryCB (Callback)
   * @return void
   */

  let clickedEmailLinkEntry = (clickedEmailLinkEntryCB) => {
    let clickedEmailLinkEntry = {
      "emailLinkId": emailLinkId,
      "campaignId": campaignId,
      "personId": personId
    };
    ClickedEmailLink.create(clickedEmailLinkEntry,
      (clickedEmailLinkEntryErr, clickedEmailLinkEntryData) => {
        if (clickedEmailLinkEntryErr) {
          clickedEmailLinkEntryCB("Error while creating ClickedEmailLink");
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
      (emailLinkIdErr, emailLinkEntry) => {
        if (emailLinkIdErr) {
          emailLinkEntryCB("Error while finding emailLink");
        }
        emailLinkEntry.updateAttribute("clickedCount",
          ++emailLinkEntry.clickedCount,
          (updatedEmailLinkEntryErr, updatedEmailLinkEntry) => {
            if (updatedEmailLinkEntryErr) {
              emailLinkEntryCB("Error while updating clickedCount");
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
      if (listMetricEntryErr) {
        listMetricEntryCB(listMetricEntryErr);
      }
      if (listMetricEntry.length > emptyArrayLength) {
        ClickedEmailLink.app.models.listMetric.updateAll({
          "campaignId": campaignId
        }, {
          "clicked": ++listMetricEntry[0].clicked
        }, (updatedListMetricEntryErr, updatedListMetricEntry) => {
          if (updatedListMetricEntryErr) {
            listMetricEntryCB("Error while updating click in listMetric");
          }
          listMetricEntryCB(null);
        });
      } else {
        ClickedEmailLink.app.models.listMetric.create({
          "clicked": 1,
          "campaignId": campaignId
        }, (listMetricEntryErr, listMetricEntry) => {
          if (listMetricEntryErr) {
            listMetricEntryCB("Error while creating click in listMetric");
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

      if (campaignMetricEntryErr) {
        campaignMetricEntryCB(campaignMetricEntryErr);
      }

      if (campaignMetricEntry.length > emptyArrayLength) {
        ClickedEmailLink.app.models.campaignMetric.updateAll({
            "campaignId": campaignId
          }, {
            "clicked": ++campaignMetricEntry[0].clicked
          },
          (updatedCampaignMetricEntryErr, updatedCampaignMetricEntry) => {
            if (updatedCampaignMetricEntryErr) {
              campaignMetricEntryCB("Update error in campaignMetric");
            }
            campaignMetricEntryCB(null);
          });
      } else {
        ClickedEmailLink.app.models.campaignMetric.create({
          "clicked": 1,
          "campaignId": campaignId
        }, (campaignMetricEntryErr, campaignMetricEntry) => {
          if (campaignMetricEntryErr) {
            campaignMetricEntryCB("Update error in campaignMetric");
          }
          campaignMetricEntryCB(null);
        });
      }
    });
  };

  ClickedEmailLink.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
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
        path: "/track",
        verb: "GET"
      }
    }
  );

};
