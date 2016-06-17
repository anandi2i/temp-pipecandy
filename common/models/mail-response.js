import _ from "lodash";
import async from "async";
import striptags from "striptags";
import logger from "../../server/log";

module.exports = function(MailResponse) {

  MailResponse.createResponse = (mailResponse, callback) => {
    MailResponse.find({
      where: {
        "mailId": mailResponse.mailId
      }
    }, (mailResponseEntryErr, mailResponseEntry) => {
      if (!_.isEmpty(mailResponseEntry)) {
        _(mailResponseEntry).forEach(mailResponse => {
          MailResponse.destroyById(mailResponse.id);
        });
      }
      MailResponse.create(mailResponse, (error, response) => {
        callback();
      });
    });
  };

  MailResponse.getLatestResponse = (mailId, callback) => {
    MailResponse.findOne({
      where: {
        "mailId": mailId
      },
      order: "receivedDate desc"
    }, (mailResponseEntryErr, mailResponseEntry) => {
      callback(mailResponseEntry);
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
  MailResponse.getUserMails = (gmail, auth, userMailId, messageId, lastMsgDate,
    nextPageToken, callback) => {
    const qryParam = "-in:CHAT -in:SENT";
    const mailToCount = 50;
    getMessageList(gmail, auth, userMailId, mailToCount, qryParam,
      nextPageToken,
      (response) => {
        nextPageToken = response.nextPageToken;
        let messagesToRead = mailToCount;
        let messageFound = false;
        if (messageId) {
          messageFound = _.find(response.messages,
            _.matchesProperty("id", messageId));
          if (messageFound) {
            messagesToRead = _.findIndex(response.messages,
              _.matchesProperty("id", messageId));
          }
        }

        let messagesSubList = _.take(response.messages, (messagesToRead++));
        async.eachSeries(messagesSubList, function(message, callbackMessage) {
          getMessage(gmail, auth, userMailId, message.id, (response) => {
            if (response.payload) {
              let mailResponse = {};
              let date = _.find(response.payload.headers,
                _.matchesProperty("name", "Date"));
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
              let deliveredTo = _.find(response.payload.headers,
                _.matchesProperty("name", "Delivered-To"));
              if (deliveredTo) {
                mailResponse.deliveredToEmailId = deliveredTo.value;
              }
              let from = _.find(response.payload.headers,
                _.matchesProperty("name", "From"));
              if (from) {
                mailResponse.fromEmailId = from.value;
              }
              let to = _.find(response.payload.headers,
                _.matchesProperty("name", "To"));
              if (to) {
                mailResponse.toEmailId = to.value;
              }
              let subject = _.find(response.payload.headers,
                _.matchesProperty("name", "Subject"));
              if (subject) {
                mailResponse.subject = subject.value;
              }
              let cc = _.find(response.payload.headers,
                _.matchesProperty("name", "Cc"));
              if (cc) {
                mailResponse.ccMailId = cc.value;
              }
              let body = null;
              if (response.payload.body) {
                body = response.payload.body.data;
              }
              if (!body) {
                body = getMessageBody(response.payload.parts[0]);
              }
              if (body) {
                let mailBody = new Buffer(body, "base64");
                let decodedBody = striptags(mailBody.toString());
                decodedBody = decodedBody.replace(/\r?\n|\r/g, " ");
                mailResponse.content = decodedBody;
              }
              MailResponse.createResponse(mailResponse, function() {
                callbackMessage();
              });
            } else {
              callbackMessage();
            }
          });
        }, (error, result) => {
          if (messageId && !messageFound) {
            listLabels(auth, messageId, lastMsgDate, nextPageToken, callback);
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
  const getMessageList = (gmail, auth, userId, maxResults, qryParam,
    nextPageToken, callback) => {
    gmail.users.messages.list({
      auth: auth,
      userId: userId,
      maxResults: maxResults,
      pageToken: nextPageToken ? nextPageToken : null,
      includeSpamTrash: true,
      q: qryParam
    }, (error, response) => {
      if (!error) {
        callback(response);
      } else {
        logger.error("Error while Getting Message List", error);
        callback(error);
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
  const getMessage = (gmail, auth, userId, messageId, callback) => {
    gmail.users.messages.get({
      auth: auth,
      userId: userId,
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
