"use strict";

import async from "async";

module.exports = function(CampaignTemplate) {

  /**
   * Prepareing Individual Email which are saved by the user
   * @param  {Campaign} campaign
   * @param  {[type]} individualTemplatePeople
   * @param  {[type]} individualEmailCB
   * @return void
   */
  CampaignTemplate.prepareIndividualEmail = (campaign,
    individualTemplatePeople, individualEmailCB) => {

    async.waterfall([
      function(setConvertPeopleObjToMap) {
        setConvertPeopleObjToMap(null, campaign, individualTemplatePeople);
      },
      convertPeopleObjToMap,
      preapreAndSaveEmailForPersonBasedTemplates
    ], (waterfallError) => {
      individualEmailCB(waterfallError);
    });

  };

  /**
   * Prepares Email and saves the Email for individual
   * @param  {[type]} peopleMap   [description]
   * @param  {[type]} saveEmailCB [description]
   * @return {[type]}             [description]
   */
  let preapreAndSaveEmailForPersonBasedTemplates = (campaign,
    individualTemplatePeople, peopleMap, saveEmailCB) => {

    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personid: {
            neq: null
          }
        }]
      }
    }, function(err, campaignTemplates) {
      async.each(campaignTemplates,
        function(campaignTemplate, campaignTemplateEachCB) {
          CampaignTemplate.app.models.emailQueue.push(
            peopleMap[campaignTemplate.personid], campaign,
            campaignTemplate, (saveEmailQueueErr) => {
              campaignTemplateEachCB(saveEmailQueueErr);
            });
        }, (campaignTemplatesAsyncErr) => {

          saveEmailCB(campaignTemplatesAsyncErr);
        });
    });
  };


  /**
   * converts Array of People To Map
   * @param  callback
   * @return peopleMap
   */
  let convertPeopleObjToMap = (campaign, individualTemplatePeople,
                                                    convertMapCB) => {
    let peopleMap = {};
    async.each(individualTemplatePeople,
      (person, peopleMapCB) => {
        peopleMap[person.id] = person;
        peopleMapCB();
      },
      function(err) {
        convertMapCB(err, campaign, individualTemplatePeople, peopleMap);
      });
  };

  /**
   * Gets Common Template for a campaign
   *
   * @param campaign
   * @return campaignTemplate
   */
  let getCommonTemplate = (campaign, commonTemplatePeople,
    getCommonTemplateCB) => {
    CampaignTemplate.find({
      where: {
        and: [{
          campaignId: campaign.id
        }, {
          personid: null
        }]
      }
    }, (getCommonTemplateErr, campaignTemplates) => {
      if (getCommonTemplateErr) {
        getCommonTemplateCB(getCommonTemplateErr);
      }
      let campaignTemplateDefaultLength = 1;
      if (campaignTemplates &&
                campaignTemplates.length >= campaignTemplateDefaultLength) {
        getCommonTemplateCB(null, campaignTemplates[0], campaign,
          commonTemplatePeople);
      }
    });
  };

  /**
   * Preapres And Save EmailQueue
   * @param  {CampaignTemplate} campaignTemplate
   * @param  {function} saveEmailQueueCB
   * @return void
   */
  let preapreAndSaveEmailForCommon = (campaignTemplate, campaign,
    commonTemplatePeople, saveEmailQueueCB) => {
    async.each(commonTemplatePeople, (person, commonTemplatePeopleCB) => {
      CampaignTemplate.app.models.emailQueue.push(person, campaign,
        campaignTemplate, (saveEmailQueueErr) => {
          commonTemplatePeopleCB(saveEmailQueueErr);
        });
    }, (commonTemplatePeopleAsyncErr) => {
      saveEmailQueueCB(commonTemplatePeopleAsyncErr);
    });
  };

  /**
   * Preparering Individual Emails for all the people excpet few
   *
   * @param campaign
   * @param commonTemplatePeople
   * @param function commonTemplateCB
   * @return void
   */
  CampaignTemplate.prepareEmailFromCommonTemplate = (campaign,
    commonTemplatePeople, commonTemplateCB) => {
    async.waterfall([
      function(setParamForGetCommonTemplate) {
        setParamForGetCommonTemplate(null, campaign, commonTemplatePeople);
      },
      getCommonTemplate,
      preapreAndSaveEmailForCommon,
    ], (asyncWaterfallErr) => {
      commonTemplateCB(asyncWaterfallErr);
    });
  };

};
