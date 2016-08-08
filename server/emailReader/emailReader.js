"use strict";

var async = require("async");
var app = require("../../server/server.js");
var constants = require("../../server/utils/constants");
var google = require("googleapis");
var lodash = require("lodash");
var emailReaderHelper = require("../../server/emailReader/emailReaderHelper");
require("console-stamp")(console,
  {pattern : constants.default.TIME_FORMAT});

const appConfig = process.cwd() + "/server/server.js";
const dataSource = require(appConfig).dataSources.psqlDs;

const gmail = google.gmail("v1");

let App = dataSource.models;

const clientSecret = app.get("googleCredentials").installed.client_secret;
const clientId = app.get("googleCredentials").installed.client_id;
const redirectUrl = app.get("googleCredentials").installed.redirect_uris[0];

/**
 * Workflow initiator to Read User Mail Box
 */
var cargo = async.cargo(function(tasks, callback) {
  async.waterfall([
    getUsers,
    initiateEmailRead,
    updateUsers,
    checkAndResetUsers
  ], function(err, result) {
    callback(err, result);
  });
}, constants.default.ONE);



/**
 * Get the user credentials for the current user from userIdentity table
 * @param  {[callback]} getUserCredentialsCB
 * @author Syed Sulaiman M
 */
function getUsers(callback) {
  App.user.getUsersToReadMail(function(usersErr, users) {
    return callback(usersErr, users);
  });
}

/**
 * Method to initiate Mail Read For Users
 *
 * @param  {[User]}   users
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function initiateEmailRead(users, callback) {
  async.each(users, (user, userCB) => {
    var userJson = user.toJSON();
    if(!userJson.identity || !userJson.identity.profile) {
      console.error(`Profile not found ${user}`);
      return callback("Profile not found");
    }
    let userMailId = userJson.identity.profile.emails[0].value;
    let userId = user.id;
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    oauth2Client.credentials.access_token =
                      userJson.identity.credentials.accessToken;
    oauth2Client.credentials.refresh_token =
                      userJson.identity.credentials.refreshToken;
    if(!userJson.identity.credentials.accessToken &&
        !userJson.identity.credentials.refreshToken) {
      console.error("Access/Refresh Token not available for User Id", userId);
      userCB(null, userMailId);
    } else {
      readEmail(oauth2Client, userId, userMailId, function(err, userMailId) {
        if(err) {
          console.error("Error fetching mails for user mail id-", userMailId);
        } else {
          console.log("Emails fetched for user mail id-", userMailId);
        }
        userCB(null, userMailId);
      });
    }
  }, (err, result) => {
    if(err){
      console.error("Error in init email reader");
      callback(err);
    }
    callback(null, users);
  });
}

/**
 * Read Users Mail Box
 *
 * @param  {Object}   auth  Gmail Auth Object
 * @param  {Number}   userId
 * @param  {String}   userMailId
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function readEmail(auth, userId, userMailId, callback) {
  let messageId = null;
  let date = null;
  let isFromSentBox = false;
  getReadLastMessage(userId, userMailId, function(error, lastReadMessage) {
    if(error) callback(error);
    if (lastReadMessage) {
      messageId = lastReadMessage.messageId;
      date = lastReadMessage.date;
      isFromSentBox = lastReadMessage.isFromSentBox;
    }
    let param = {
      userId: userId,
      userMailId: userMailId,
      messageId: messageId,
      lastMsgDate: date,
      nextPageToken: null,
      isFromSentBox: isFromSentBox
    };
    emailReaderHelper.readUserMails(App, gmail, auth, param,
        function(err, response) {
      callback(err, userMailId);
    });
  });
}

/**
 * Get User's Last Read Mail
 *
 * @param  {Number}   userId
 * @param  {String}   userMailId
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function getReadLastMessage(userId, userMailId, callback) {
  let lastReadMessage = null;
  App.inboxMail.getLatestResponse(userId, function(error, inboxMail) {
    if(error) return callback(error);
    if (inboxMail) {
      lastReadMessage = {
        messageId: inboxMail.mailId,
        date: inboxMail.receivedDate
      };
      return callback(null, lastReadMessage);
    }
    App.sentMailBox.getInitialMsgforUser(userId,
        function(error, initialMsg) {
      if(error) return callback(error);
      if (initialMsg) {
        lastReadMessage = {
          messageId: initialMsg.mailId,
          date: initialMsg.sentDate,
          isFromSentBox: true
        };
        return callback(null, lastReadMessage);
      }
      return callback(null, lastReadMessage);
    });
  });
}

/**
 * Update User to set isMailReaded flag to true
 *
 * @param  {[User]}   users
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateUsers(users, callback) {
  async.each(users, (user, userCB) => {
    user.updateAttribute("isMailReaded", true, (updateErr, updatedInst) => {
      userCB(updateErr, updatedInst);
    });
  }, (asyncError) => {
    callback(asyncError, users);
  });
}

/**
 * Update User to set isMailReaded flag to false,
 * 	 if not user available with isMailReaded flag true
 *
 * @param  {[User]}   users
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function checkAndResetUsers(users, callback) {
  App.user.getUsersToReadMail((usersErr, users) => {
    if(usersErr) {
      return callback(usersErr);
    }
    if(lodash.isEmpty(users)) {
      App.user.resetMailReadFlag((err, info) => {
        return callback(err, info);
      });
    } else {
      return callback(usersErr, users);
    }
  });
}

module.exports = {
  cargo: cargo
};
