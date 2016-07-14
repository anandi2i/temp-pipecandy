"use strict";

import async from "async";
import constants from "../../server/utils/constants";
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
  InboxMail.updateClass = (inboxMail, classification, callback) => {
    inboxMail.updateAttribute("class", classification,
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
        {arg: "classification", type: "string"},
        {arg: "start", type: "number"},
        {arg: "limit", type: "number"}
      ],
      returns: {arg: "InboxMail", type: "array", root: true},
      http: {verb: "get", path: "/campaign/:campaignId/:classification"}
    }
  );
  /**
   * Method to return inbox mails
   * @param  {Object}   ctx
   * @param  {Number}   campaignId
   * @param  {String}   classification - [all, bounced, out-of-office, actionalble, nurture, negative]
   * @param  {Number}   start
   * @param  {Number}   limit
   * @param  {Function} callback
   * @return {[InboxMail]} list of InboxMail
   */
  InboxMail.inboxMails = (ctx, campaignId, classification, start, limit,
        callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit,
        classification);
    if (errorMessage) {
      return callback(errorMessage);
    }
    let whereQry = {};
    if(classification === "all") {
      whereQry = {
        and: [
          {campaignId: campaignId},
          {count: {gt: 1}}
        ]};
    } else {
      whereQry = {
        and: [
          {campaignId: campaignId},
          {count: {gt: 1}},
          {class: classification}
        ]};
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

  InboxMail.remoteMethod(
    "updateClassification", {
      description: "Update Inbox Mails Classification",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number"},
        {arg: "classification", type: "string"}
      ],
      returns: {arg: "InboxMail", type: "array", root: true},
      http: {verb: "put", path: "/:id/:classification"}
    }
  );
  /**
   * API to Update Mail Classification
   * @param  {Number}   id InboxMail Id
   * @param  {String}   classification
   * @param  {Function} callback
   * @return {InboxMail} Updated InboxMail Class
   * @author Syed Sulaiman M
   */
  InboxMail.updateClassification = (ctx, id, classification, callback) => {
    if(!constants.CLASSIFICATIONS.includes(classification)) {
      const errorMessage = errorMessages.INVALID_CLASSIFICATION;
      return callback(errorMessage);
    }
    InboxMail.findById(id, (inboxMailErr, inboxMail) => {
      if(inboxMailErr) {
        logger.error("Error finding InboxMail",
          {error: inboxMailErr, stack: inboxMailErr.stack, input:
          {inboxMailId:id, classification:classification}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if(!inboxMail) {
        const errorMessage = errorMessages.INVALID_INBOX_MAIL_ID;
        return callback(errorMessage);
      }
      async.parallel([
        async.apply(InboxMail.updateClass, inboxMail, classification),
        async.apply(InboxMail.app.models.MailResponse.updateUserClassByThreadId,
          inboxMail.threadId, classification)
      ], (err, results) => {
        if(err) {
          logger.error("Error updating Email Class",
            {error: err, stack: err.stack, input:
            {inboxMailId:id, classification:classification}});
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        let updatedInboxMail = results[0]; // Result of First Function
        return callback(null, updatedInboxMail);
      });
    });
  };

  /**
   * Method To validate mail request
   * @param  {Number} campaignId
   * @param  {Number} start
   * @param  {Number} limit
   * @param  {String} classification Mail Class
   * @return {Object}
   */
  const validateMailRequest = (campaignId, start, limit, classification) => {
    const zero = 0;
    let errorMessage = null;
    if (campaignId <= zero) {
      errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
    } else if (start < zero) {
      errorMessage = errorMessages.INVALID_START;
    } else if (limit <= zero) {
      errorMessage = errorMessages.INVALID_LIMIT;
    } else if(!constants.CLASSIFICATIONS.includes(classification) &&
        classification !== "all") {
      errorMessage = errorMessages.INVALID_CLASSIFICATION;
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
