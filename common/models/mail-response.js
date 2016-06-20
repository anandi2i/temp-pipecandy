import lodash from "lodash";
import async from "async";
import striptags from "striptags";
import logger from "../../server/log";
import mailEnqueue from "../../server/mailCrawler/mailEnqueue";
import emojiStrip from "emoji-strip";
import googleTokenHandler from "../../server/mailCrawler/googleTokenHandler";

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
    MailResponse.update({
      "id": mailResponse.id
    }, {
      NLPClass: mailResponse.NLPClass
    }, (err, results) => {
      return callback(err, results);
    });
  };

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
  MailResponse.getUserMails = (gmail, auth, userId, userMailId, messageId,
    lastMsgDate, nextPageToken, callback) => {
    const qryParam = "-in:CHAT -in:SENT";
    const mailToCount = 50;
    getMessageList(gmail, auth, userId, userMailId, mailToCount, qryParam,
      nextPageToken,
      (response) => {
        nextPageToken = response.nextPageToken;
        let messagesToRead = mailToCount;
        let messageFound = false;
        if (messageId) {
          messageFound = lodash.find(response.messages,
            lodash.matchesProperty("id", messageId));
          if (messageFound) {
            messagesToRead = lodash.findIndex(response.messages,
              lodash.matchesProperty("id", messageId));
          }
        }

        let messageSubList = lodash.take(response.messages, (messagesToRead++));
        async.eachSeries(messageSubList, function(message, callbackMessage) {
          getMessage(gmail, auth, userMailId, message.id, (response) => {
            let payload = response.payload;
            if (payload) {
              let mailResponse = {};
              mailResponse.userId = userId;
              let headers = payload.headers;
              let date = lodash.find(headers,
                lodash.matchesProperty("name", "Date"));
              if (date) {
                mailResponse.receivedDate = new Date(date.value);
                if (!messageFound && lastMsgDate) {
                  messageFound =
                    (new Date(date.value) < lastMsgDate) ? message : null;
                  if (messageFound) return false;
                }
              }
              mailResponse.mailId = response.id;
              mailResponse.threadId = response.threadId;
              mailResponse.labels = response.labelIds;
              let deliveredTo = lodash.find(headers,
                lodash.matchesProperty("name", "Delivered-To"));
              if (deliveredTo) {
                mailResponse.deliveredToEmailId = deliveredTo.value;
              }
              let from = lodash.find(headers,
                lodash.matchesProperty("name", "From"));
              if (from) {
                mailResponse.fromEmailId = from.value;
              }
              let to = lodash.find(headers,
                lodash.matchesProperty("name", "To"));
              if (to) {
                mailResponse.toEmailId = to.value;
              }
              let subject = lodash.find(headers,
                lodash.matchesProperty("name", "Subject"));
              if (subject) {
                mailResponse.subject = subject.value;
              }
              let cc = lodash.find(headers,
                lodash.matchesProperty("name", "Cc"));
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
                let decodedBody = striptags(mailBody.toString());
                decodedBody = decodedBody.replace(/\r?\n|\r/g, " ");
                // Regular expression to extract reply message alone
                let regExBody = "On (Sun|Mon|Tue|Wed|Thu|Fri|Sat), (.*)wrote:";
                let regExIndex = decodedBody.match(regExBody);
                let replyMsg = decodedBody.trim();
                if (regExIndex) {
                  const zero = 0;
                  replyMsg = decodedBody.substr(zero, regExIndex.index).trim();
                }
                replyMsg = emojiStrip(replyMsg);
                mailResponse.content = replyMsg;
              }
              MailResponse.createResponse(mailResponse, (error, response) => {
                let queueName = "mailNLPIdentification";
                mailEnqueue.enqueueMail(JSON.stringify(response), queueName,
                  () => {
                    callbackMessage();
                  });
              });
            } else {
              callbackMessage();
            }
          });
        }, (error, result) => {
          if (messageId && !messageFound) {
            MailResponse.getUserMails(gmail, auth, userId, userMailId,
              messageId, lastMsgDate, nextPageToken, callback);
          } else {
            callback();
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
  const getMessageList = (gmail, auth, userId, userMailId, maxResults, qryParam,
    nextPageToken, callback) => {
    gmail.users.messages.list({
      auth: auth,
      userId: userMailId,
      maxResults: maxResults,
      pageToken: nextPageToken ? nextPageToken : null,
      includeSpamTrash: true,
      q: qryParam
    }, (error, response) => {
      if (!error) {
        callback(response);
      } else {
        logger.error("Error while Getting Message List", error);
        if (error.responseCode = 401) {
          MailResponse.app.models.userIdentity.findById(userId,
                    (err, userIdentity) => {
            googleTokenHandler.updateAccessToken(userIdentity,
                      (tokenHandlerErr, updateUser) => {
              MailResponse.app.models.userIdentity
                      .updateCredentials(userIdentity,
                            (userIdentityErr, userIdentityInst) => {
                auth.credentials.access_token =
                          userIdentityInst.credentials.accessToken;
                auth.credentials.refresh_token =
                          userIdentityInst.credentials.refreshToken;
                return getMessageList(gmail, auth, userId, userMailId,
                          maxResults, qryParam, nextPageToken, callback);
              });
            });
          });
        }
      }
    });
  };

  /**
   * Get Message List for the particular user id
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   * @param {userId} Id of User whose mail needs to be pulled.
   * @param {messageId} Id of Mail whose info needs to be pulled.
   * @param {labelIds} Labels to pull filter the mails.
   * @param {callback} A callback function.
   */
  const getMessage = (gmail, auth, userMailId, messageId, callback) => {
    gmail.users.messages.get({
      auth: auth,
      userId: userMailId,
      id: messageId
    }, (error, response) => {
      if (!error) {
        callback(response);
      } else {
        logger.error("Error while Getting Message", error);
        callback(error);
      }
    });
  };

  /**
   * get Message Body from response parts tag
   * @param  {parts} parts in response tag
   * @return {messageBody} messageBody in parts tag
   */
  const getMessageBody = (parts) => {
    if (parts.hasOwnProperty("parts")) {
      let part = parts.parts[0];
      getMessageBody(part);
    }
    return parts.body.data;
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
