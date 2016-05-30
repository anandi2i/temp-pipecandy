"use strict";

import moment from "moment-timezone";
import lodash from "lodash";

module.exports = function(EmailQueue) {
  /**
   * builds the Email Queue Object and saving in the Email Queue table
   * @param  person
   * @param  campaign
   * @param  campaignTemplate
   * @param  function saveEmailQueueCB
   * @return void
   */
  EmailQueue.push = (person, campaign, campaignTemplate, saveEmailQueueCB) => {
    prepareScheduledAt(campaign, person, (prepareScheduledAtErr,
                                                          scheduledAt) => {
      if (prepareScheduledAtErr) {
        saveEmailQueueCB(prepareScheduledAtErr);
      }
      var emailQueue = {
        email: person.email,
        content: campaignTemplate.content,
        campaignTemplateId: campaignTemplate.id,
        campaignId: campaignTemplate.campaignId,
        userId: campaign.createdBy,
        personId: person.id,
        scheduledAt: scheduledAt
      };

      EmailQueue.create(emailQueue, (emailQueueErr, emailQueueObj) => {
        if (emailQueueErr) {
          saveEmailQueueCB(emailQueueErr);
        }
        console.log("Pushed Email to the Queue", emailQueueObj);
        saveEmailQueueCB();
      });
    });
  };

  /**
   * Preparering ScheduledAt for Individual
   *
   * @param campaign
   * @param person
   * @param function prepare ScheduledAt Callback
   * @return void
   */
  let prepareScheduledAt = (campaign, person, prepareScheduledAtCB) => {
    let scheduledAt = new Date();
    try {
      if (campaign.scheduledAt) {
        if (person.time_zone) {
          var personZoneTime = moment(campaign.scheduledAt)
                            .tz(person.time_zone).format("YYYY-MM-DDTHH:mm:ss");
          var systemTimeZone = moment().format("Z");
          personZoneTime += systemTimeZone;
          scheduledAt = new Date(personZoneTime);
        } else {
          scheduledAt = campaign.scheduledAt;
        }
      }
      prepareScheduledAtCB(null, scheduledAt);
    } catch (prepareScheduledAtERR) {
      prepareScheduledAtCB(prepareScheduledAtERR);
    }
  };



  EmailQueue.assembleEmails = (campaignId) => {

    EmailQueue.app.models.campaign.getPeopleByCampaignId(campaignId,
      (err, campaignPeople, campaign) => {
        if (err) {
          console.log(err);
        }
        EmailQueue.app.models.person.getIndividualTemplatePeople(campaign,
          (err, individualTemplatePeople) => {
            if (err) {
              console.log(err);
            }
            let commonTemplatePeople = lodash.differenceBy(campaignPeople,
                                              individualTemplatePeople, "id");
            console.log(commonTemplatePeople);
            EmailQueue.app.models.campaignTemplate
                    .prepareIndividualEmail(campaign, individualTemplatePeople,
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("Added individual Emails in EmailQueue");
                }
              });
            EmailQueue.app.models.campaignTemplate
                .prepareEmailFromCommonTemplate(campaign, commonTemplatePeople,
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("Added Campain Emails in EmailQueue");
                }
              });
          });
      });

  };

};
