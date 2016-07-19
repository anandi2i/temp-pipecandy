"use strict";

var lodash = require("lodash");
var async = require("async");
var striptags = require("striptags");
var mailEnqueue = require("../../server/emailReader/mailEnqueue");
var emojiStrip = require("emoji-strip");
var googleTokenHandler = require("../../server/utils/googleTokenHandler");
var constants = require("../../server/utils/constants");
require("console-stamp")(console, 
  {pattern : constants.default.TIME_FORMAT});

// Regular expression to extract reply message alone
const regExBody = "On ((Sun|Mon|Tue|Wed|Thu|Fri|Sat),|([0-3]*))(.*)wrote:";

/**
 * Method which reads mail id from user;s mail box
 *
 * @param  {[gmail client]}   gmail used to get mails from mail box
 * @param  {[Object]}   auth  authorization read mail box
 * @param  {[String]}   userMailId  user's mail id whose mail to be fetched
 * @param  {[String]}   messageId   last fetched mail id
 * @param  {[Date]}   lastMsgDate   last fectched mail date
 * @param  {[String]}   nextPageToken accessToken to read next page
 * @param  {Function} callback      a callback function
 */
function readUserMails(App, gmail, auth, param, callback) {
  param.qryParam = "-in:CHAT";
  param.maxResults = 100;
  getMessageList(App, gmail, auth, param, (error, response) => {
    if(error) {
      return callback(error);
    }
    param.nextPageToken = response.nextPageToken;
    let messagesToRead = param.maxResults;
    let messageFound = false;
    if (param.messageId) {
      messageFound = lodash.find(response.messages,
        lodash.matchesProperty("id", param.messageId));
      if (messageFound) {
        messagesToRead = lodash.findIndex(response.messages,
          lodash.matchesProperty("id", param.messageId));
        if(param.isFromSentBox) {
          const bufferToLoadAllEmails = 25;
          messagesToRead += bufferToLoadAllEmails;
        }
      }
    }

    let messageSubList = lodash.take(response.messages, (messagesToRead++));
    let grpdMsgListByThrdId = lodash.groupBy(messageSubList, "threadId");
    const threadIds = lodash.keys(grpdMsgListByThrdId);

    async.eachSeries(threadIds, function(threadId, threadIdCB) {
      App.sentMailBox.findByUserIdAndThreadId(param.userId, threadId,
            (sentMailErr, sentMail) => {
        if(sentMailErr) {
          console.error("Error while getting Sent Mail for User Id - ",
              param.userId, "for Thread Id", message.threadId, sentMailErr);
          threadIdCB(sentMailErr);
        } else {
          if(sentMail) {
            getMessageByThreadId(gmail, auth, param.userMailId, threadId,
                  (error, response) => {
              if(error) threadIdCB(error);
              let messagesInThread = response.messages;
              let messagesToProcess = getMessageToBeProcessed(messagesInThread,
                  grpdMsgListByThrdId, threadId);
              async.eachSeries(messagesToProcess, function(message, messageCB) {
                let payload = message.payload;
                if (payload) {
                  let mailResponse =
                    constructResponse(param.userId, sentMail, payload, message);
                  if (mailResponse.receivedDate && !messageFound
                        && param.lastMsgDate) {
                    messageFound =
                      (mailResponse.receivedDate < param.lastMsgDate)
                      ? true : false;
                    if (messageFound) return messageCB(null);
                  }
                  processMailResponse(App, param, mailResponse, sentMail,
                        (error, result) => {
                    messageCB(null);
                  });
                } else {
                  messageCB(null);
                }
              }, () => {
                  threadIdCB(null);
              });
            });
          } else {
            threadIdCB(null);
          }
        }
      });
    }, () => {
      if (param.messageId && !messageFound && param.nextPageToken) {
        readUserMails(App, gmail, auth, param, callback);
      } else {
        callback(null);
      }
    });
  });
};

/**
 * Get Message List for the particular user id
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {userId} Id of User whose mail needs to be pulled.
 * @param {labelIds} Labels to pull filter the mails.
 * @param {maxResults} Maximum number of mails to read.
 * @param {callback} A callback function.
 */
function getMessageList(App, gmail, auth, param, callback) {
  gmail.users.messages.list({
    auth: auth,
    userId: param.userMailId,
    maxResults: param.maxResults,
    pageToken: param.nextPageToken ? param.nextPageToken : null,
    includeSpamTrash: true,
    q: param.qryParam
  }, (error, response) => {
    if (error) {
      console.error("Error while Getting Message List", error);
      const invalidCode = 401;
      if (error.code === invalidCode) {
        updateUserCredentials(App, auth, param, (error, auth) => {
          return getMessageList(App, gmail, auth, param, callback);
        });
      } else {
        return callback(error);
      }
    } else {
      return callback(null, response);
    }
  });
}

/**
 * Get Message List for the particular user id
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param {userId} Id of User whose mail needs to be pulled.
 * @param {messageId} Id of Mail whose info needs to be pulled.
 * @param {labelIds} Labels to pull filter the mails.
 * @param {callback} A callback function.
 */
function getMessageByThreadId(gmail, auth, userMailId, threadId, callback) {
  gmail.users.threads.get({
    auth: auth,
    userId: userMailId,
    id: threadId
  }, (error, response) => {
    if (error) {
      console.error("Error while Getting Message By Thread Id", error);
      callback(error);
    } else {
      callback(null, response);
    }
  });
}

/**
 * get Message Body from response parts tag
 * @param  {parts} parts in response tag
 * @return {messageBody} messageBody in parts tag
 */
function getMessageBody(parts) {
  if (parts.hasOwnProperty("parts")) {
    let part = parts.parts[0];
    getMessageBody(part);
  }
  return parts.body.data;
}

/**
 * Method to Construct mailResponse model
 *
 * @param  {Number} userId
 * @param  {Object} payload
 * @param  {Object} response Inbox Response
 * @author Syed Sulaiman M
 */
function constructResponse(userId, sentMail, payload, response) {
  let mailResponse = {};
  mailResponse.userId = userId;
  mailResponse.personId = sentMail.toPersonId;
  let headers = payload.headers;
  let date = lodash.find(headers, lodash.matchesProperty("name", "Date"));
  if (date) {
    mailResponse.receivedDate = new Date(date.value);
  }
  mailResponse.mailId = response.id;
  mailResponse.threadId = response.threadId;
  mailResponse.labels = response.labelIds;
  let deliveredTo = lodash.find(headers,
    lodash.matchesProperty("name", "Delivered-To"));
  if (deliveredTo) {
    mailResponse.deliveredToEmailId = deliveredTo.value;
  }
  let from = lodash.find(headers, lodash.matchesProperty("name", "From"));
  if (from) {
    mailResponse.fromEmailId = from.value;
  }
  let to = lodash.find(headers, lodash.matchesProperty("name", "To"));
  if (to) {
    mailResponse.toEmailId = to.value;
  }
  let subject = lodash.find(headers, lodash.matchesProperty("name", "Subject"));
  if (subject) {
    mailResponse.subject = subject.value;
  }
  let cc = lodash.find(headers, lodash.matchesProperty("name", "Cc"));
  if (cc) {
    mailResponse.ccMailId = cc.value;
  }
  let body = null;
  if (payload.body) {
    body = payload.body.data;
  }
  if (!body) {
    body = getMessageBody(payload.parts[0]);
  }
  if (body) {
    let mailBody = new Buffer(body, "base64");
    mailBody = mailBody.toString();
    let mailBodyTmp = mailBody.replace(/\r?\n|\r/g, " ");
    mailBodyTmp = mailBodyTmp.toString();
    let regExIndex = mailBodyTmp.match(regExBody);
    let replyMsg = mailBody.trim();
    if (regExIndex) {
      const zero = 0;
      replyMsg = mailBody.substr(zero, regExIndex.index).trim();
    }
    mailResponse.content = replyMsg;
  }
  return mailResponse;
}

/**
 * Update User's Gmail credentials
 *
 * @param  {DataSource}   App
 * @param  {Auth}   auth
 * @param  {Object}   param
 * @param  {Function} callback
 * @return {Auth}
 * @author Syed Sulaiman M
 */
function updateUserCredentials(App, auth, param, callback) {
  App.userIdentity.findByUserId(param.userId, (err, userIdentity) => {
    googleTokenHandler.updateAccessToken(userIdentity[0],
        (tokenHandlerErr, userIdentity) => {
      App.userIdentity.updateCredentials(userIdentity,
          (userIdentityErr, userIdentityInst) => {
        auth.credentials.access_token =
          userIdentityInst.credentials.accessToken;
        auth.credentials.refresh_token =
          userIdentityInst.credentials.refreshToken;
        return callback(null, auth);
      });
    });
  });
}

/**
 * Create Mail response
 *
 * @param  {Object}   param
 * @param  {MailResponse}   mailResponse
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function processMailResponse(App, param, mailResponse, sentMail, callback) {
  App.MailResponse.createResponse(mailResponse,
        (error, response) => {
    async.parallel([
      function(tableUpdateCB) {
        updateRelatedTables(App, param, response, sentMail, (error, response)=>{
          if(error) {
            console.error("Error while updating Tables for User Id - ",
              param.userId, "for Thread Id", message.threadId, error);
          }
          tableUpdateCB(null);
        });
      },
      function(mailEnqueueCB) {
        let isSent = response.labels.includes("SENT");
        if(!isSent) {
          let queueName = "intelligenceIn";
          let replyMsg = getPlainTextFromBody(mailResponse.content);
          mailResponse.content = replyMsg;
          mailEnqueue.enqueueMail(JSON.stringify(response), queueName,
              (err, data) => {
            mailEnqueueCB(null);
          });
        } else {
          mailEnqueueCB(null);
        }
      }
    ], function(err, results) {
      callback(err, results);
    });
  });
}

function updateRelatedTables(App, param, mailResponse, sentMail, callback) {
  async.parallel([
    updateSentMailBox.bind(null, App, param, mailResponse, sentMail),
    updateInboxMail.bind(null, App, param, mailResponse, sentMail)
  ], function(err, results) {
    callback(err, results);
  });
}

/**
 * Method to Update Sent Mail Box Entry
 *
 * @param  {Object} param     Email Queue Object
 * @param  {MailResponse} mailResponse    Sent Mail Content
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateSentMailBox(App, param, mailResponse, sentMail, callback) {
  App.sentMailBox.findByUserIdAndThreadId(param.userId, mailResponse.threadId,
        (err, sentMailBoxInst) => {
    if(sentMailBoxInst.mailId !== mailResponse.mailId) {
      let replyMsg = getPlainTextFromBody(mailResponse.content);
      const one = 1;
      let attrToUpdate = {
        content: replyMsg,
        count: sentMailBoxInst.count + one,
        sentDate: mailResponse.receivedDate
      };
      App.sentMailBox.updateAttr(sentMailBoxInst, attrToUpdate, (err, res) => {
        callback(null, param, mailResponse, sentMail);
      });
    } else {
      callback(null, param, mailResponse, sentMail);
    }
  });
}

/**
 * Method to Update Inbox Mail Entry
 *
 * @param  {Object} param     Email Queue Object
 * @param  {MailResponse} mailResponse    Sent Mail Content
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateInboxMail(App, param, mailResponse, sentMail, callback) {
  let replyMsg = getPlainTextFromBody(mailResponse.content);
  let inboxMailInst = {
    fromEmailId: mailResponse.fromEmailId,
    toEmailId: mailResponse.toEmailId,
    threadId: mailResponse.threadId,
    mailId: mailResponse.mailId,
    count: 1,
    subject: mailResponse.subject,
    content: replyMsg,
    receivedDate: mailResponse.receivedDate,
    personId: sentMail.toPersonId,
    campaignId: sentMail.campaignId,
    userId: param.userId
  };
  App.inboxMail.saveOrUpdate(inboxMailInst, function(err, response) {
    updateMetricForResponded(App, response, function (err, result) {
      callback(null, param, mailResponse, sentMail);
    });
  });
}

/**
 * Update Related Metric for Responded Count
 * @param  {InboxMail}   inboxMail
 * @param  {MailResponse}   mailData
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateMetricForResponded(App, inboxMail, callback) {
  App.inboxMail.updateMetricForResponded(inboxMail, function (err, inboxMail) {
    if(err) {
      console.error("Error updating metric for responded for userId and"
        + " threadId", mailData.userId, mailData.threadId, err);
    }
    callback(null);
  });
}

/**
 * Method to extract Text alone from Reply Message
 *
 * @param  {Object} content Email Body
 * @return {Object} Reply Text Alone
 * @author Syed Sulaiman M
 */
function getPlainTextFromBody(content) {
  let decodedBody = striptags(content);
  decodedBody = decodedBody.replace(/\r?\n|\r/g, " ");
  let regExIndex = decodedBody.match(regExBody);
  let replyMsg = decodedBody.trim();
  if (regExIndex) {
    const zero = 0;
    replyMsg = decodedBody.substr(zero, regExIndex.index).trim();
  }
  replyMsg = emojiStrip(replyMsg);
  return replyMsg;
}

/**
 * Get Messages To Be Processed
 *  This method will filter already Processed Messages
 * @param  {[Object]} messagesInThread
 * @param  {[Object]} grpdMsgListByThrdId
 * @return {[Object]}      List of Message Objects to be Processed
 * @author Syed Sulaiman M
 */
function getMessageToBeProcessed(messagesInThread, grpdMsgListByThrdId,
      threadId) {
  let messages = grpdMsgListByThrdId[threadId];
  let messagesToProcess = lodash.filter(messagesInThread, function(o) {
    let filteredMsgs = lodash.find(messages, {"id":o.id});
    return !lodash.isEmpty(filteredMsgs);
  });
  messagesToProcess = lodash.sortBy(messagesToProcess, function(o) {
    let headers = o.payload.headers;
    let date = lodash.find(headers, lodash.matchesProperty("name", "Date"));
    if (!date) {
      console.error("Date not Available for threadId", threadId, headers);
      return new Date();
    }
    return new Date(date.value);
  });
  return messagesToProcess;
}

module.exports = {
  readUserMails: readUserMails
};
