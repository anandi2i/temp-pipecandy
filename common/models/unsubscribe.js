"use strict";

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
