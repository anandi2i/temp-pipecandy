var googleAuth = require("google-auth-library");
var google = require("googleapis");
var async = require("async");
var _ = require("lodash");

const gmail = google.gmail("v1");

const dataSource = require(process.cwd() + "/server/server.js")
      .dataSources.psqlDs;
let App = dataSource.models;


const clientSecretClientID = "478206392598-5f7o7lchi5nsfiomn8btrg2g2ninu5fv\
.apps.googleusercontent.com";

const clientSecretCredentials = {
  "installed": {
    "client_id": clientSecretClientID,
    "project_id": "pipecandy-1294",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "JA8ZGbKaMmg4sOZhLQ08Eb_y",
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
  }
};

const clientSecret = clientSecretCredentials.installed.client_secret;
const clientId = clientSecretCredentials.installed.client_id;
const redirectUrl = clientSecretCredentials.installed.redirect_uris[0];

const auth = new googleAuth();
const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);


const interval = 5000;
setInterval(function() {

  /**
   * Provides a list of mails for the current userId from the last recorded
   * mailId
   * @param  {[function]} getUserCredentials for the current user
   * @param  {[function]} fetches the mails for the current user
   * @param  {[callback]}
   * @return void
   */
  async.waterfall([
    getUserCredentials,
    crawler
  ], function(err, result) {
    console.log("Emails fetched for user id - ", result);
  });

}, interval);


/**
 * Get the user credentials for the current user from userIdentity table
 * @param  {[callback]} getUserCredentialsCB
 */
function getUserCredentials(callback) {
  App.userIdentity.getCrawlableUsers(function(usersErr, users) {
    _(users).forEach((user) => {
        let userMailId = user.profile.emails[0].value;
        oauth2Client.credentials = user.credentials;
        callback(null, oauth2Client, userMailId);
    });
  });
}

/**
 * Crawl to list mails
 * @param  {[object]} auth  Generated OAuth2 for the current user
 * @param  {[callback]} crawlerCB
 */
function crawler(auth, userMailId, callback) {
  let messageId = null;
  let date = null;
  App.MailResponse.getLatestResponse(userMailId, function(mailResponse) {
    if (mailResponse) {
      messageId = mailResponse.mailId;
      date = mailResponse.receivedDate;
    }
    App.MailResponse.getUserMails(gmail, auth, userMailId, messageId,
        date, null, function() {
      callback(null, userMailId);
    });
  });
}
