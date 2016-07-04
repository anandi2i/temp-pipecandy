"use strict";

var googleAuth = require("google-auth-library");
var google = require("googleapis");
var striptags = require("striptags");
var googleTokenHandler = require("../../server/mailCrawler/googleTokenHandler");
var async = require("async");
var lodash = require("lodash");
var config = require("../../server/config.json");
var statusCodes = require("../../server/utils/status-codes");

var gmailClass = google.gmail("v1");

var dataSource = require(process.cwd() + "/server/server.js").dataSources
  .psqlDs;

var async = require("async");
var App = dataSource.models;

var tempCacheUserCredentials = {};

/**
 * Gets all scheduled email from email queue table
 *
 * @param  {Function} callback
 * @return {Object}            List of Mails to be sent
 * @author Syed Sulaiman M
 */
function getEmailQueue(callback) {
  App.emailQueue.getMailsToSent(function(queuedMailsErr, queuedMails) {
    callback(queuedMailsErr, queuedMails);
  });
}

/**
 * Method to Generate Mail Content and Sent Mails
 *
 * @param  {Object}   queuedMails List of Queued Mails to be Sent
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function generateAndSendEmail(queuedMails, callback) {
  async.waterfall([
      function getReqParams(getReqParamsCB) {
        getReqParamsCB(null, queuedMails);
      },
      filterEmailQueue,
      generateCredentials
    ],
    function(error) {
      if (error) {
        console.log("Error while Generate and Send Mail: " + error);
        return callback(callback);
      }
      console.log("All Mails Sent");
      return callback(null);
    });
}

/**
 * Method to Filter Emails that are not to be sent
 * @param  {Function} filterEmailCB callback function
 * @author Syed Sulaiman M
 */
function filterEmailQueue(emailQueue, filterEmailCB) {
  const groupedEmailQueue = lodash.groupBy(emailQueue, "campaignId");
  const campaignIds = lodash.keys(groupedEmailQueue);
  App.campaign.getCampaigns(campaignIds, function (campaignsErr, campaigns) {
    if(campaignsErr) {
      return filterEmailCB(campaignsErr);
    }
    async.parallel([
      function(updateErrorFlagCB) {
        const campaignsNotToRun = lodash.filter(campaigns,
            function(o) {
          return (o.statusCode !== statusCodes.default.readyToSend)
              && (o.statusCode !== statusCodes.default.executingCampaign);
        });
        updateErrorFlag(campaignsNotToRun, groupedEmailQueue,
              function(error) {
          updateErrorFlagCB(error, campaignsNotToRun);
        });
      },
      function(emailQueueCB) {
        const campaignsToRun = lodash.filter(campaigns,
            function(o) {
          return (o.statusCode === statusCodes.default.readyToSend)
              || (o.statusCode === statusCodes.default.executingCampaign);
        });
        emailQueue = lodash.flatMap(campaignsToRun, function(o) {
          return groupedEmailQueue[o.id];
        });
        emailQueueCB(null, emailQueue);
      }
    ],
    function(err, results) {
      let emailQueue = results[1]; // Contains filtered Emails
      filterEmailCB(null, emailQueue);
    });
  });
}

/**
 * For each user pick the gmail credentials from useridentity tabe and load it
 * in tempCacheUserCredentials and then generate mail
 * @param emailQueue
 * @return void
 */
function generateCredentials(emailQueue, generateCredentialsCB) {
  async.each(emailQueue, function(emailQueueEntry, emailQueueCB) {
      let mailContent = {
        mailId: emailQueueEntry.id,
        personEmail: emailQueueEntry.email,
        mailSubject: striptags(emailQueueEntry.subject),
        contents: emailQueueEntry.content
      };
      let userId = emailQueueEntry.userId;
      getUserCredentialsFromCache(userId,
        function(userCredentialErr, userCredential) {
          mailContent.userDetails = {
            userid: emailQueueEntry.userId,
            name: userCredential.profile.displayName,
            email: userCredential.profile.emails[0],
            credential: userCredential.credentials
          };
          mailSender(emailQueueEntry, mailContent, function(err) {
            emailQueueCB();
          });
        });
    },
    function(err) {
      if (err) {
        console.log("err: ", err);
        return generateCredentialsCB(err);
      }
      return generateCredentialsCB(null);
    });
}

/**
 * Get User Credentials from Temporary Cache Object
 * @param  {Number}   userId
 * @param  {Function} callback
 * @return {Object}   User Credential Object
 * @author Syed Sulaiman M
 */
function getUserCredentialsFromCache(userId, callback) {
  if (!tempCacheUserCredentials[userId]) {
    App.userIdentity.findByUserId(userId,
      function(usercredentialErr, usercredential) {
        tempCacheUserCredentials[userId] = usercredential[0];
        let userCredentialsCache = usercredential[0];
        callback(null, userCredentialsCache);
      });
  } else {
    let userCredentialsCache = tempCacheUserCredentials[userId];
    callback(null, userCredentialsCache);
  }
}

function updateErrorFlag(campaignsNotToRun, groupedEmailQueue, callback) {
  let emailQueueToStop = lodash.flatMap(campaignsNotToRun, function(o) {
    return groupedEmailQueue[o.id];
  });
  async.each(emailQueueToStop,
        function(emailQueueInst, emailQueueInstCB) {
    let emailQueueUpdateElements = {
      isStopped: true,
      isError: true,
      stoppedBy: "SYSTEM",
      stoppedReson: "Status Not Supported while Sending"
    };
    App.emailQueue.updateInst(emailQueueInst, emailQueueUpdateElements,
          function (error, updatedInst) {
      emailQueueInstCB(error, updatedInst);
    });
  }, function(error) {
    if(error) {
      console.log("Error while Updating Email Queue", error);
    }
    callback(error);
  });
}

/**
 * Construct the mail with the mail content and send to the corresponding person
 * @param credentials
 * @return void
 */

function mailSender(emailQueue, mailContent, mailSenderCB) {
  async.waterfall([
    function getReqParams(getReqParamsCB) {
      getReqParamsCB(null, emailQueue, mailContent);
    },
    buildEmail,
    sendEmail,
    updateRelatedTables
  ],
  function(err) {
    if (err) {
      console.log("waterfallErr: " + err);
    }
    mailSenderCB(null);
  });
}

/**
 * Build the mail with the credentials and the mail content
 * @param credentials
 * @return void
 */
function buildEmail(emailQueue, mailContent, buildEmailCB) {
  var clientSecret = config.googleCredentials.installed.client_secret;
  var clientId = config.googleCredentials.installed.client_id;
  var redirectUrl = config.googleCredentials.installed.redirect_uris[0];

  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  oauth2Client.credentials.access_token =
    mailContent.userDetails.credential.accessToken;
  oauth2Client.credentials.refresh_token =
    mailContent.userDetails.credential.refreshToken;

  var emailLines = [];
  emailLines.push("From: " + mailContent.userDetails.name + " <" +
    mailContent.userDetails.email.value + ">");
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
      const invalidCode = 401;
      if (err.code === invalidCode) {
        App.userIdentity.find({
          where: {
            "userId": mailContent.userDetails.userid
          }
        }, (err, userIdentity) => {
          googleTokenHandler.updateAccessToken(userIdentity[0],
            (tokenHandlerErr, updateUser) => {
              App.userIdentity.updateCredentials(userIdentity[0],
                (userIdentityErr, userIdentityInst) => {
                  oauth2Client.credentials.access_token =
                    userIdentityInst.credentials.accessToken;
                  oauth2Client.credentials.refresh_token =
                    userIdentityInst.credentials.refreshToken;
                  return sendEmail(base64EncodedEmail, oauth2Client,
                    emailQueue, mailContent, sendEmailCB);
                });
            });
        });
      }
    } else {
      delete tempCacheUserCredentials[mailContent.userDetails.userid];
      App.emailQueue.destroyById(mailContent.mailId, function(err, data) {
        if (err) {
          sendEmailCB(err);
        }
        console.log(results);
        sendEmailCB(null, emailQueue, mailContent, results);
      });
    }
  });
}

/**
 * Method to Update Related Tables once Mail is Sent
 * @param  {Object} emailQueue
 * @param  {Object} mailContent
 * @param  {Object} sentMailResp
 * @param  {Function} updateRelatedTablesCB
 * @author Syed Sulaiman M
 */
function updateRelatedTables(emailQueue, mailContent, sentMailResp,
      updateRelatedTablesCB) {
  async.parallel([
    createAudit.bind(null, emailQueue, mailContent, sentMailResp),
    updateCampaignMetric.bind(null, emailQueue, mailContent, sentMailResp),
    updateListMetric.bind(null, emailQueue, mailContent, sentMailResp),
    updateSentMailBox.bind(null, emailQueue, mailContent, sentMailResp)
  ],
  function(err, results) {
    if (err) {
      console.log("Error while Updating related tables: " + err);
    }
    updateRelatedTablesCB(null);
  });
}

/**
 * Creates an audit in Campaign Audit table
 *
 * @param  {Object} emailQueue
 * @param  {Object} mailContent
 * @param  {Object} sentMailResp
 * @param  {Function} createAuditCB
 * @author Syed Sulaiman M
 */
function createAudit(emailQueue, mailContent, sentMailResp, createAuditCB) {
  let campaignAuditInst = {};
  campaignAuditInst.email = mailContent.personEmail;
  campaignAuditInst.content = mailContent.contents;
  campaignAuditInst.subject = mailContent.mailSubject;
  campaignAuditInst.sentTime = new Date();
  campaignAuditInst.fromEmail = mailContent.userDetails.email.value;
  campaignAuditInst.userId = emailQueue.userId;
  campaignAuditInst.personId = emailQueue.personId;
  campaignAuditInst.campaignId = emailQueue.campaignId;
  campaignAuditInst.mailId = sentMailResp.id;
  campaignAuditInst.threadId = sentMailResp.threadId;
  App.campaignAudit.create(campaignAuditInst, function(err, response) {
    createAuditCB(null, emailQueue, mailContent, sentMailResp);
  });
}

/**
 * Update Campaign Metric for sent mail
 * @param  {Object} emailQueue     Email Queue Object
 * @param  {Object} mailContent    Sent Mail Content
 * @param  {Object} sentMailResp   Sent Mail Response
 * @param  {Function} updateMetricCB callback function
 * @author Syed Sulaiman M
 */
function updateCampaignMetric(emailQueue, mailContent, sentMailResp,
  updateMetricCB) {
  let campaignMetricInst = {};
  campaignMetricInst.sentEmails = 1;
  campaignMetricInst.campaignId = emailQueue.campaignId;
  App.campaignMetric.find({
    where: {
      campaignId: emailQueue.campaignId
    }
  }, (campaignMetricErr, campaignMetric) => {
    if (campaignMetricErr) {
      console.error("Error in updating Campaign Metric", campaignMetricErr);
    }
    if (!lodash.isEmpty(campaignMetric)) {
      campaignMetricInst = campaignMetric[0];
      campaignMetricInst.sentEmails = ++campaignMetric[0].sentEmails;
    }
    App.campaignMetric.upsert(campaignMetricInst, function(err, response) {
      if (err) {
        console.error("Error in updating Campaign Metric", err);
      }
      updateMetricCB(null, emailQueue, mailContent, sentMailResp);
    });
  });
}

/**
 * Update List Metric for sent mail
 * @param  {Object} emailQueue     Email Queue Object
 * @param  {Object} mailContent    Sent Mail Content
 * @param  {Object} sentMailResp   Sent Mail Response
 * @param  {Function} updateMetricCB callback function
 * @author Syed Sulaiman M
 */
function updateListMetric(emailQueue, mailContent, sentMailResp,
      updateMetricCB) {
  getCommonList(emailQueue.campaignId, emailQueue.personId,
    function(commonLists) {
      async.each(commonLists, (commonList, commonListCB) => {
        commonList.listMetrics((listMetricsErr, listMetrics) => {
          let listMetricInst = {};
          listMetricInst.sentEmails = 1;
          listMetricInst.listId = commonList.id;
          listMetricInst.campaignId = emailQueue.campaignId;
          if (!lodash.isEmpty(listMetrics)) {
            listMetricInst = listMetrics[0];
            listMetricInst.sentEmails = ++listMetrics[0].sentEmails;
          }
          App.listMetric.upsert(listMetricInst, function(err, response) {
            if (err) {
              console.error("Error in updating List Metric", err);
            }
            commonListCB(null, response);
          });
        });
      }, function(err) {
        if (err) {
          console.error("Error in updating List Metric", err);
        }
        return updateMetricCB(null, emailQueue, mailContent, sentMailResp);
      });
    });
}

/**
 * Method to Update Sent Mail Box Entry
 *
 * @param  {Object} emailQueue     Email Queue Object
 * @param  {Object} mailContent    Sent Mail Content
 * @param  {Object} sentMailResp   Sent Mail Response
 * @param  {Function} updateSentMailBoxCB callback function
 * @author Syed Sulaiman M
 */
function updateSentMailBox(emailQueue, mailContent, sentMailResp,
    updateSentMailBoxCB) {
  let sentMailBoxInst = {
    toEmailId: mailContent.personEmail,
    toPersonId: emailQueue.personId,
    threadId: sentMailResp.threadId,
    mailId: sentMailResp.id,
    fromEmailId: mailContent.userDetails.email.value,
    userId: emailQueue.userId,
    campaignId: emailQueue.campaignId,
    count: 1,
    subject: mailContent.mailSubject,
    content: mailContent.contents,
    sentDate: new Date()
  };
  App.sentMailBox.saveOrUpdate(sentMailBoxInst, function(err, response) {
    updateSentMailBoxCB(null, emailQueue, mailContent, sentMailResp);
  });
}

/**
 * Method to Get common list of Campaign and Person
 * @param  {Number}   campaignId
 * @param  {Number}   personId
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function getCommonList(campaignId, personId, callback) {
  async.parallel([
    (campaignListCB) => {
      App.campaign.findById(campaignId, (campaignInstErr, campaignInst) => {
        if (campaignInstErr) {
          campaignListCB(campaignInstErr);
        }
        campaignInst.lists((listsErr, lists) => {
          campaignListCB(listsErr, lists);
        });
      });
    },
    (personListCB) => {
      App.person.findById(personId, (personInstErr, personInst) => {
        if (personInstErr) {
          campaignListCB(personInstErr);
        }
        personInst.lists((listsErr, lists) => {
          personListCB(listsErr, lists);
        });
      });
    }
  ], function(err, results) {
    if (err) {
      console.error("Unable to get List ", err);
      callback([]);
    } else {
      let campaignList = results[0];
      let personList = results[1];
      let commonLists = lodash.intersectionBy(campaignList, personList, "id");
      callback(commonLists);
    }
  });
}

module.exports = {
  getEmailQueue: getEmailQueue,
  generateAndSendEmail: generateAndSendEmail
};
