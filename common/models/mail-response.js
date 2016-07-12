"use strict";

import lodash from "lodash";
import async from "async";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(MailResponse) {

  /**
   * Method to create mail response entry
   * @param  {Object}   mailResponse contains properties for mail response table
   * @param  {Function} callback     callback function
   */
  MailResponse.createResponse = (mailResponse, callback) => {
    MailResponse.find({
      where: {
        "mailId": mailResponse.mailId
      }
    }, (mailResponseEntryErr, mailResponseEntry) => {
      if (!lodash.isEmpty(mailResponseEntry)) {
        lodash(mailResponseEntry).forEach(mailResponse => {
          MailResponse.destroyById(mailResponse.id);
        });
      }
      MailResponse.create(mailResponse, (error, response) => {
        callback(error, response);
      });
    });
  };

  /**
   * Method to get latest mail
   * @param  {Integer}   userId
   * @param  {String}   mailId
   * @param  {Function} callback
   */
  MailResponse.getLatestResponse = (userId, mailId, callback) => {
    MailResponse.findOne({
      where: {
        "userId": userId
      },
      order: "receivedDate desc"
    }, (mailResponseEntryErr, mailResponseEntry) => {
      callback(mailResponseEntry);
    });
  };

  /**
   * update nlp class for mail
   * @param  {Object}   mailResponse
   * @param  {Function} callback
   */
  MailResponse.updateMailClass = (mailResponse, callback) => {
    MailResponse.findById(mailResponse.id, (err, result) => {
      if(err || !result) {
        return callback(err || "Mail response object seems to be empty");
      }
      result.updateAttribute("NLPClass", mailResponse.NLPClass,
          (updateErr, updatedData) => {
        return callback(updateErr, updatedData);
      });
    });
  };

  MailResponse.remoteMethod(
    "mailThread", {
      description: "Get Mail Thread",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "threadId", type: "String"}
      ],
      returns: {arg: "MailResponse", type: "array", root: true},
      http: {verb: "get", path: "/threadId/:threadId"}
    }
  );
  /**
   * Method to return inbox mails
   * @param  {Object}   ctx
   * @param  {String}   threadId
   * @param  {Function} callback
   * @return {[MailResponse]} list of MailResponse
   * @author Syed Sulaiman M
   */
  MailResponse.mailThread = (ctx, threadId, callback) => {
    MailResponse.find({
      include: "person",
      where: {
        threadId: threadId
      },
      order: "createdAt DESC"
    }, (mailResponsesErr, mailResponses) => {
      if (mailResponsesErr) {
        logger.error("Error while getting mailResponses", mailResponsesErr);
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      let responses = [];
      async.each(mailResponses, (mailResponse, mailResponseCB) => {
        var mailResponseJSON = mailResponse.toJSON();
        let response = JSON.parse(JSON.stringify(mailResponse));
        response.person = {
          firstName: mailResponseJSON.person.firstName,
          middleName: mailResponseJSON.person.middleName,
          lastName: mailResponseJSON.person.lastName,
          email: mailResponseJSON.person.email,
          timeZone: mailResponseJSON.person.time_zone
        };
        delete response.labels;
        responses.push(response);
        mailResponseCB(null);
      }, (error) => {
        return callback(null, responses);
      });
    });
  };
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  MailResponse.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

};
