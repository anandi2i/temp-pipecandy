var google = require("googleapis");
var async = require("async");

const gmail = google.gmail("v1");

const dataSource = require(process.cwd() + "/server/server.js")
  .dataSources.psqlDs;
let App = dataSource.models;

const clientSecretCredentials = {
  "web": {
    "client_id": "478206392598-0uq1vtkne494bdhnlb1k4fjson3shjap.apps.googleusercontent.com",
    "project_id": "pipecandy-1294",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "-9z-cU18aImvflghMHWaz4oW",
    "redirect_uris": [
      "http://staging.pipecandy.com/auth/google/callback",
      "http://localhost:3001/auth/google/callback",
      "http://pipecandy.com/auth/google/callback",
      "http://localhost:3000/auth/google/callback",
      "http://dev.pipecandy.com/auth/google/callback"
    ]
  }
};

const clientSecret = clientSecretCredentials.web.client_secret;
const clientId = clientSecretCredentials.web.client_id;
const redirectUrl = clientSecretCredentials.web.redirect_uris[0];

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);


const interval = 10000;

initCrawl();

/**
 * Initiate Workflow for every interval
 */
function initCrawl() {
  setTimeout(initWorkflow, interval);
}

/**
 * Workflow initiator to read mail box
 */
function initWorkflow() {

  async.waterfall([
    getUserCredentials
  ], function(err, result) {
    initCrawl();
  });

};


/**
 * Get the user credentials for the current user from userIdentity table
 * @param  {[callback]} getUserCredentialsCB
 */
function getUserCredentials(callback) {
  App.userIdentity.getCrawlableUsers(function(usersErr, userIdentities) {
    async.eachSeries(userIdentities, function (userCred , userCB) {
      let userMailId = userCred.profile.emails[0].value;
      oauth2Client.credentials.access_token =
                        userCred.credentials.accessToken;
      oauth2Client.credentials.refresh_token =
                        userCred.credentials.refreshToken;
      crawler(oauth2Client, userCred.userId, userMailId,
                  function(err, userMailId) {
        console.log("Emails fetched for user mail id - ", userMailId);
        userCB(null, userMailId);
      });
    }, function done() {
      callback(null, "Done");
    });
  });
}

/**
 * Crawl to list mails
 * @param  {[object]} auth  Generated OAuth2 for the current user
 * @param  {[callback]} crawlerCB
 */
function crawler(auth, userId, userMailId, callback) {
  let messageId = null;
  let date = null;
  App.MailResponse.getLatestResponse(userId, userMailId, function(mailResponse) {
    if (mailResponse) {
      messageId = mailResponse.mailId;
      date = mailResponse.receivedDate;
    }
    App.MailResponse.getUserMails(gmail, auth, userId, userMailId, messageId,
      date, null,
      function() {
        callback(null, userMailId);
      });
  });
}
