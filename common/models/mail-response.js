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
      if(mailResponseEntryErr) {
        logger.error("Error while getting SentBoxMail", {
            error: mailResponseEntryErr,
            stack: mailResponseEntryErr.stack,
            input: {userId:userId, mailId:mailId}
        });
        return callback(mailResponseEntryErr);
      }
      return callback(null, mailResponseEntry);
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

  /**
   * Find MailResponses by threadId
   * @param  {String}   threadId
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  MailResponse.findByThreadId = (threadId, callback) => {
    MailResponse.find({
      where: {
        threadId: threadId
      }
    }, (mailResponsesErr, mailResponses) => {
      return callback(mailResponsesErr, mailResponses);
    });
  };

  /**
   * Update User Class for Mail by Thread Id
   * @param  {String}  threadId
   * @param  {String}  userClass
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  MailResponse.updateUserClassByMailId = (mailId, userClass, callback) => {
    MailResponse.updateAll({
      mailId : mailId
    }, {
      UserClass : userClass
    }, (updateErr, info) => {
      if(updateErr) {
        logger.error("Error while updating MailResponse",
          {error: updateErr, stack: updateErr.stack,
            input: {threadId: threadId}});
        return callback(updateErr);
      }
      return callback(null, info);
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
      order: "createdAt ASC"
    }, (mailResponsesErr, mailResponses) => {
      if (mailResponsesErr) {
        logger.error("Error while getting mailResponses", mailResponsesErr);
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      let responses = [];
      async.each(mailResponses, (mailResponse, mailResponseCB) => {
        var mailResponseJSON = mailResponse.toJSON();
        mailResponse.content= mailResponse.content
          .replace(/<a class=("|')(unsubscribe)(.*?)(>)/g,
          "<a class='unsubscribe' href='#'>");
        let response = JSON.parse(JSON.stringify(mailResponse));
        response.person = {
          firstName: mailResponseJSON.person.firstName,
          middleName: mailResponseJSON.person.middleName,
          lastName: mailResponseJSON.person.lastName,
          email: mailResponseJSON.person.email,
          timeZone: mailResponseJSON.person.timeZone
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
