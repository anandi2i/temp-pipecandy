"use strict";

import async from "async";
import lodash from "lodash";

module.exports = function(Campaign) {

  /**
   * Returns Uniq People using campaignId
   * @param  {integer} campaignId
   * @param  {function} getPeopleCallback
   * @return {[Array[Person], campaign]}
   */
  Campaign.getPeopleByCampaignId = (campaignId, getPeopleCallback) => {
    let people = [];
    Campaign.findById(campaignId, (campaignError, campaign) => {
      if (campaignError) {
        getPeopleCallback(campaignError);
      }
      campaign.lists((listError, lists) => {
        if (listError) {
          getPeopleCallback(listError);
        }
        async.each(lists, (list, listCallBack) => {
          list.people((err, peopleList) => {
            people = people.concat(peopleList);
            listCallBack();
          });
        }, (err) => {
          getPeopleCallback(err, lodash.uniqBy(people, "id"), campaign);
        });
      });
    });
  };

};
