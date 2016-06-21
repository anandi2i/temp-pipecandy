var googleAuth = require("google-auth-library");
var google = require("googleapis");
var AWS = require("aws-sdk");

var emptyArrayLength = 0;

AWS.config.update({
  accessKeyId: "AKIAJUDP7FRPRTLTANWA",
  secretAccessKey: "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"
});

var gmailClass = google.gmail("v1");

var dataSource = require(process.cwd() + "/server/server.js").dataSources
                                                                  .psqlDs;

var async = require("async");
var App = dataSource.models;

var tempCacheUserCredentials = {};

//Client Secret Key Generated from Google Console.
var clientSecretClientID = "478206392598-5f7o7lchi5nsfiomn8btrg2g2ninu5fv\
.apps.googleusercontent.com";
var clientSecretCredentials = {
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


/**
 * Watch the emailQueue Table at the interval of 1 minute
 */
var oneMinute = 60000;
setInterval(function() {

  async.waterfall([
      getCurrentEmailQueue,
      generateCredentials
    ],
    function(err) {
      if (err) {
        console.log("waterfallErr: " + err);
      }
      console.log("All Mails are sent");
    });

}, oneMinute);




/**
 * Gets all scheduled email from email queue table for the current time
 */

function getCurrentEmailQueue(getCurrentEmailQueueCB) {
  App.emailQueue.find({
    where: {
      scheduledAt: {
        lte: Date.now()
      }
    }
  }, function(emailQueueErr, emailQueue) {
    if (emailQueueErr) {
      getCurrentEmailQueueCB(emailQueueErr);
    }
    if (emailQueue.length > emptyArrayLength) {
      getCurrentEmailQueueCB(null, emailQueue);
    } else {
      getCurrentEmailQueueCB("No Mails scheduled");
    }


  });
}


/**
 * For each user pick the gmail credentials from useridentity tabe and load it
 * in tempCacheUserCredentials and then generate mail
 * @param emailQueue
 * @return void
 */

function generateCredentials(emailQueue, generateCredentialsCB) {

  async.each(emailQueue,
    function(emailQueueEntry, emailQueueItemCB) {

      var mailContent = {
        mailId: emailQueueEntry.id,
        personEmail: emailQueueEntry.email,
        mailSubject: emailQueueEntry.subject,
        contents: emailQueueEntry.content
      };

      if (!tempCacheUserCredentials[emailQueueEntry.userId]) {

        App.userIdentity.find({
          where: {
            userId: emailQueueEntry.userId
          }
        }, function(err, usercredential) {

          tempCacheUserCredentials[emailQueueEntry.userId] = usercredential[0];

          mailContent.userDetails = {
            userid: emailQueueEntry.userId,
            name: usercredential[0].profile.displayName,
            email: usercredential[0].profile.emails[0],
            credential: usercredential[0].credentials
          };

          mailSender(emailQueueEntry, mailContent, function(err) {
            emailQueueItemCB();
          });

        });
      } else {

        var userCredentialsFromCache =
          tempCacheUserCredentials[emailQueueEntry.userId];

        mailContent.userDetails = {
          userid: emailQueueEntry.userId,
          name: userCredentialsFromCache.profile.displayName,
          email: userCredentialsFromCache.profile.emails[0],
          credential: userCredentialsFromCache.credentials
        };

        mailSender(emailQueueEntry, mailContent, function(err) {
          emailQueueItemCB();
        });

      }
    },
    function(err) {
      if (err) {
        console.log("err: ", err);
      }
      generateCredentialsCB();
    });
}


/**
 * Construct the mail with the mail content and send to the corresponding person
 * @param credentials
 * @return void
 */

function mailSender(emailQueue, mailContent, mailSenderCB) {
  async.waterfall([
      buildEmail,
      sendEmail,
      createAudit
    ],
    function(err) {
      if (err) {
        console.log("waterfallErr: " + err);
      }
      mailSenderCB(null);
    });


  /**
   * Build the mail with the credentials and the mail content
   * @param credentials
   * @return void
   */

  function buildEmail(buildEmailCB) {

    var clientSecret = clientSecretCredentials.installed.client_secret;
    var clientId = clientSecretCredentials.installed.client_id;
    var redirectUrl = clientSecretCredentials.installed.redirect_uris[0];

    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    oauth2Client.credentials.access_token =
          mailContent.userDetails.credential.accessToken;
    oauth2Client.credentials.refresh_token =
          mailContent.userDetails.credential.refreshToken;
    //oauth2Client.credentials = mailContent.userDetails.credential.credentials;

    var emailLines = [];
    emailLines.push("From: " + mailContent.userDetails.name + " <"
                          + mailContent.userDetails.email.value + ">");
    emailLines.push("To: <" + mailContent.personEmail + ">");
    emailLines.push("Content-type: text/html;charset=iso-8859-1");
    emailLines.push("MIME-Version: 1.0");
    emailLines.push("Subject: " + mailContent.mailSubject);
    emailLines.push("");
    emailLines.push(mailContent.contents);

    var email = emailLines.join("\r\n").trim();
    var base64EncodedEmail = new Buffer(email).toString("base64");
    base64EncodedEmail = base64EncodedEmail.replace(/\+/g, "-")
      .replace(/\//g, "_");

    buildEmailCB(null, base64EncodedEmail, oauth2Client, emailQueue,
          mailContent);
  }

  /**
   * Send the mail with the credentials and the mail content in base64 Encoded
   * format
   * @param base64EncodedEmail
   * @param oauth2Client
   * @param userId
   * @return void
   */

  function sendEmail(base64EncodedEmail, oauth2Client, emailQueue, mailContent,
          sendEmailCB) {

    gmailClass.users.messages.send({
      auth: oauth2Client,
      userId: mailContent.userDetails.email.value,
      resource: {
        raw: base64EncodedEmail
      }
    }, function(err, results) {
      if (err) {
        console.log("Gmail err:", err);
      } else {
        delete tempCacheUserCredentials[mailContent.userDetails.userid];
        App.emailQueue.destroyById(mailContent.mailId, function(err, data) {
          if (err) {
            sendEmailCB(err);
          }
          console.log(results);

          sendEmailCB(null, emailQueue, mailContent);
        });
      }
    });
  }

  /**
   * Creates an audit in Campaign Audit table
   * @param  {Object} emailQueue
   * @param  {Object} mailContent
   * @param  {Function} createAuditCB
   */
  function createAudit(emailQueue, mailContent, createAuditCB) {
    let campaignAuditInst = {};
    campaignAuditInst.email = mailContent.personEmail;
    campaignAuditInst.content = mailContent.contents;
    campaignAuditInst.sentTime = new Date();
    campaignAuditInst.fromEmail = mailContent.userDetails.email.value;
    campaignAuditInst.userId = emailQueue.userId;
    campaignAuditInst.personId = emailQueue.personId;
    campaignAuditInst.campaignId = emailQueue.campaignId;
    App.campaignAudit.create(campaignAuditInst, function (err, response) {
      createAuditCB(null, response);
    });
  }

}
