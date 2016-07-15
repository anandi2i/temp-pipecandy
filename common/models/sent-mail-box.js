"use strict";

import async from "async";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(SentMailBox) {

  /**
   * Method to save or update Sent Mail Box Instance.
   * If already Instance availabel with the Thread Id the Instance will be
   * 		 updated otherwise created
   *
   * @param  {SentMailBox}   sentMailBox
   * @param  {Function} callback
   * @return {SentMailBox} SentMailBox Instance
   * @author Syed Sulaiman M
   */
  SentMailBox.saveOrUpdate = (sentMailBox, callback) => {
    SentMailBox.find({
      include: "person",
      where: {
        threadId: sentMailBox.threadId
      }
    }, (sentMailBoxesErr, sentMailBoxes) => {
      if(sentMailBoxesErr) return callback(sentMailBoxesErr);
      let sentMailBoxToUpdate = sentMailBoxes[0];
      if(sentMailBoxToUpdate) {
        const one = 1;
        sentMailBox.count = sentMailBoxToUpdate.count + one;
        sentMailBoxToUpdate.updateAttributes(sentMailBox,
              (err, updatedSentMailBox) => {
          return callback(null, updatedSentMailBox);
        });
      } else {
        SentMailBox.create(sentMailBox, (err, sentMailBoxInst) => {
          return callback(null, sentMailBoxInst);
        });
      }
    });
  };

  /**
   * Find Sent Mail By User Id and Thread Id
   * @param  {Number}   userId
   * @param  {Number}   threadId
   * @param  {Function} callback
   * @return {SentMailBox}
   * @author Syed Sulaiman M
   */
  SentMailBox.findByUserIdAndThreadId = (userId, threadId, callback) => {
    SentMailBox.find({
      where: {
        userId: userId,
        threadId: threadId
      }
    }, (sentMailBoxesErr, sentMailBoxes) => {
      return callback(sentMailBoxesErr, sentMailBoxes[0]);
    });
  };

  /**
   * Update count of SentMailBox
   *
   * @param  {SentMailBox}   sentMailBoxInst
   * @param  {Function} callback
   * @return {SentMailBox}
   * @author Syed Sulaiman M
   */
  SentMailBox.updateAttr = (sentMailBoxInst, attrToUpdate, callback) => {
    sentMailBoxInst.updateAttributes(attrToUpdate,
        (updateErr, updatedData) => {
      return callback(updateErr, updatedData);
    });
  };

  /**
   * Get Initial Message Sent By User
   * @param  {Number}   userId
   * @param  {Function} callback
   * @return {SentMailBox}
   * @author Syed Sulaiman M
   */
  SentMailBox.getInitialMsgforUser = (userId, callback) => {
    SentMailBox.findOne({
      where: {
        userId: userId
      },
      order: "createdAt ASC"
    }, (sentMailBoxErr, sentMailBox) => {
      if(sentMailBoxErr) {
        logger.error("Error while getting SentBoxMail", {
            error: sentMailBoxErr,
            stack: sentMailBoxErr.stack,
            input: {userId:userId}
        });
        return callback(sentMailBoxErr);
      }
      return callback(null, sentMailBox);
    });
  };

  SentMailBox.remoteMethod(
    "sentMails", {
      description: "Get Sent Mails",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "campaignId", type: "number"},
        {arg: "start", type: "number"},
        {arg: "limit", type: "number"}
      ],
      returns:
        {arg: "CampaignAudit", type: "array", root: true},
      http: {
        verb: "get",
        path: "/sentMails/campaign/:campaignId"
      }
    }
  );
  /**
   * Method to return sent mails
   * @param  {Object}   ctx
   * @param  {Number}   campaignId
   * @param  {Number}   start
   * @param  {Number}   limit
   * @param  {Function} callback
   * @return {[Object]} list of Campaign Audit
   * @author Syed Sulaiman M
   */
  SentMailBox.sentMails = (ctx, campaignId, start, limit, callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit);
    if (errorMessage) {
      return callback(errorMessage);
    }
    SentMailBox.find({
      where: {
        campaignId: campaignId
      },
      order: "createdAt DESC",
      limit: limit,
      skip: start
    }, (sentMailsErr, sentMails) => {
      if (sentMailsErr) {
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      let responses = [];
      async.each(sentMails, (sentMail, sentMailCB) => {
        sentMail.person((personErr, person) => {
          let response = JSON.parse(JSON.stringify(sentMail));
          response.person = {
            firstName: person.firstName,
            middleName: person.middleName,
            lastName: person.lastName,
            email: person.email,
            timeZone: person.time_zone
          };
          responses.push(response);
          sentMailCB(null);
        });
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
   * @return {Object} Error Object
   * @author Syed Sulaiman M
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
  SentMailBox.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
