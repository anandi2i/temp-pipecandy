"use strict";

import async from "async";
import logger from "../../server/log";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(InboxMail) {

  /**
   * Find Inbox Mail By User Id and Thread Id
   * @param  {Number}   userId
   * @param  {Number}   threadId
   * @param  {Function} callback
   * @return {SentMailBox}
   * @author Syed Sulaiman M
   */
  InboxMail.findByUserIdAndThreadId = (userId, threadId, callback) => {
    InboxMail.find({
      where: {
        userId: userId,
        threadId: threadId
      }
    }, (inboxMailsErr, inboxMails) => {
      return callback(inboxMailsErr, inboxMails[0]);
    });
  };

  /**
   * update nlp class for mail
   * @param  {Object}   mailResponse
   * @param  {Function} callback
   */
  InboxMail.updateActionable = (inboxMail, actionable, callback) => {
    inboxMail.updateAttribute("actionable", actionable,
        (updateErr, updatedData) => {
      return callback(updateErr, updatedData);
    });
  };

  /**
   * Method to save or update Inbox Mail Instance.
   * If already Instance availabel with the Thread Id the Instance will be
   * 		 updated otherwise created
   *
   * @param  {InboxMail}   inboxMail
   * @param  {Function} callback
   * @return {InboxMail} InboxMail Instance
   * @author Syed Sulaiman M
   */
  InboxMail.saveOrUpdate = (inboxMail, callback) => {
    InboxMail.find({
      where: {
        threadId: inboxMail.threadId
      }
    }, (inboxMailsErr, inboxMails) => {
      if(inboxMailsErr) {
        logger.error("Error while getting inbox mail for thread id ",
            inboxMail.threadId, inboxMailsErr);
        return callback(inboxMailsErr);
      }
      let inboxMailToUpdate = inboxMails[0];
      if(inboxMailToUpdate) {
        const one = 1;
        inboxMail.count = inboxMailToUpdate.count + one;
        inboxMailToUpdate.updateAttributes(inboxMail,
              (err, updatedInboxMail) => {
          return callback(null, updatedInboxMail);
        });
      } else {
        InboxMail.create(inboxMail, (err, inboxMailInst) => {
          if(err) {
            logger.error("Error while creating inbox Entry", err);
          }
          return callback(null, inboxMailInst);
        });
      }
    });
  };

  InboxMail.remoteMethod(
    "inboxMails", {
      description: "Get Inbox Mails",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "campaignId", type: "number"},
        {arg: "start", type: "number"},
        {arg: "limit", type: "number"},
        {arg: "actionable", type: "boolean"}
      ],
      returns: {arg: "InboxMail", type: "array", root: true},
      http: {verb: "get", path: "/campaign/:campaignId"}
    }
  );
  /**
   * Method to return inbox mails
   * @param  {Object}   ctx
   * @param  {Number}   campaignId
   * @param  {Number}   start
   * @param  {Number}   limit
   * @param  {Function} callback
   * @return {[InboxMail]} list of InboxMail
   */
  InboxMail.inboxMails = (ctx, campaignId, start, limit, actionable,
        callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit);
    if (errorMessage) {
      return callback(errorMessage);
    }
    let whereQry = {};
    if(actionable) {
      whereQry={campaignId: campaignId, actionable: true};
    } else {
      whereQry={campaignId: campaignId};
    }
    InboxMail.find({
      include: "person",
      where: whereQry,
      order: "createdAt DESC",
      limit: limit,
      skip: start
    }, (inboxMailsErr, inboxMails) => {
      if (inboxMailsErr) {
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      let responses = [];
      async.each(inboxMails, (inboxMail, inboxMailCB) => {
        var inboxMailJSON = inboxMail.toJSON();
        let response = JSON.parse(JSON.stringify(inboxMail));
        response.person = {
          firstName: inboxMailJSON.person.firstName,
          middleName: inboxMailJSON.person.middleName,
          lastName: inboxMailJSON.person.lastName,
          email: inboxMailJSON.person.email,
          timeZone: inboxMailJSON.person.time_zone
        };
        responses.push(response);
        inboxMailCB(null);
      }, (error) => {
        return callback(null, responses);
      });
    });
  };

  /**
   * Method To validate mail request
   * @param  {Number} campaignId
   * @param  {Number} start
   * @param  {Number} limit
   * @return {Object}
   */
  const validateMailRequest = (campaignId, start, limit) => {
    const zero = 0;
    let errorMessage = null;
    if (campaignId <= zero) {
      errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
    } else if (start < zero) {
      errorMessage = errorMessages.INVALID_START;
    } else if (limit <= zero) {
      errorMessage = errorMessages.INVALID_LIMIT;
    }
    return errorMessage;
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   * @author Syed Sulaiman M
   */
  InboxMail.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
