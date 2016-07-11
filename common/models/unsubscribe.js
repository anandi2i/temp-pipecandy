"use strict";

import lodash from "lodash";
import logger from "../../server/log";

module.exports = function(Unsubscribe) {

  /**
   * Get Unsubscribed Persons
   *
   * @param  {Number}   userId     [description]
   * @param  {Number}   personId   [description]
   * @param  {Number}   campaignId [description]
   * @param  {Function} callback   [description]
   * @author Syed Sulaiman M
   */
  Unsubscribe.get = (userId, personId, campaignId, callback) => {
    Unsubscribe.find({
      where: {
        userId: userId,
        personId: personId,
        campaignId: campaignId
      }
    }, (unsubscribesErr, unsubscribes) => {
      return callback(unsubscribesErr, unsubscribes[0]);
    });
  };

  /**
   * Get Unsubscribed Persons for List of User Ids
   * @param  {[type]}   userId   [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   * @author Syed Sulaiman M
   */
  Unsubscribe.getByUserIds = (userIds, callback) => {
    Unsubscribe.find({
      where: {
        userId: {
          inq: userIds
        }
      }
    }, (unsubscribesErr, unsubscribes) => {
      return callback(unsubscribesErr, unsubscribes);
    });
  };
//npm run calls
  /**
   * if a prospect is unsubscribed for a user mean we should not generate the email
   * for the prospect. So this mehtod allows us to wether the prospect is in
   * user's Unsubscribers list or not
   * @param  {[campaign]} campaign
   * @param  {[person]} person
   * @param  {[Function]} eligibleCheckCB [callback]
   * @author Ramanavel Selvaraju
   */
  Unsubscribe.eligibleCheck = (campaign, person, eligibleCheckCB) => {
    Unsubscribe.find({where: {and:
      [{userId: campaign.createdBy}, {personId: person.id}]
    }}, (unsubscribesErr, unsubscribes) => {
      if(unsubscribesErr) {
        logger.error("Error on finding the Unsubscribe", {
          error: unsubscribesErr, stack: unsubscribesErr.stack,
          input: {campaign: campaign, person: person}
        });
        return eligibleCheckCB(unsubscribesErr, false);
      }//if err
      return eligibleCheckCB(null, lodash.isEmpty(unsubscribes));
    });
  };

//observers
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   * @author Syed Sulaiman M
   */
  Unsubscribe.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
