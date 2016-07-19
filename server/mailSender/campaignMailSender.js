"use strict";

var googleAuth = require("google-auth-library");
var google = require("googleapis");
var striptags = require("striptags");
var googleTokenHandler = require("../../server/utils/googleTokenHandler");
var async = require("async");
var lodash = require("lodash");
var config = require("../../server/config.json");
var statusCodes = require("../../server/utils/status-codes");
var constants = require("../../server/utils/constants");
require("console-stamp")(console, 
  {pattern : constants.default.TIME_FORMAT});

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
        console.error("Error while Generate and Send Mail: " + error);
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
    async.waterfall([
      function getReqParams(getReqParamsCB) {
        getReqParamsCB(null, emailQueue, campaigns, groupedEmailQueue);
      },
      filterCampaignByStatus,
      filterUnsubscribePerson
    ],
    function(err, result) {
      filterEmailCB(null, result);
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
          if(!userCredential.credentials.accessToken &&
              !userCredential.credentials.refreshToken) {
            console.error("Access or Refresh Token not available for User Id",
                emailQueueEntry.userId);
            emailQueueCB();
          } else {
            mailSender(emailQueueEntry, mailContent, function(err) {
              emailQueueCB();
            });
          }
        });
    },
    function(err) {
      if (err) {
        console.error("err: ", err);
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

/**
 * Method to Update Error And Stopped Flag for EmailQueue
 * @param  {[Object]}   campaignsNotToRun
 * @param  {[Object]}   groupedEmailQueue
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateStoppedFlag(emailQueueToStop, stoppedBy, isError, reason,
    callback) {
  async.each(emailQueueToStop,
        function(emailQueueInst, emailQueueInstCB) {
    let emailQueueUpdateElements = {
      isStopped: true,
      isError: isError,
      stoppedBy: stoppedBy,
      stoppedReason: reason
    };
    App.emailQueue.updateInst(emailQueueInst, emailQueueUpdateElements,
          function (error, updatedInst) {
      emailQueueInstCB(error, updatedInst);
    });
  }, function(error) {
    if(error) {
      console.error("Error while Updating Email Queue", error);
    }
    callback(error);
  });
}

/**
 * Method to Filter Out Unsubscribed Persons From Email List
 * @param  {[Object]}   emailQueue
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function filterUnsubscribePerson(emailQueue, campaigns, groupedEmailQueue,
    callback) {
  const emailQueueGroupByUser = lodash.groupBy(emailQueue, "userId");
  const userIds = lodash.keys(emailQueueGroupByUser);
  App.unsubscribe.getByUserIds(userIds,
        function (unsubscribesErr, unsubscribes) {
    if(unsubscribesErr) {
        unsubscribeCB(unsubscribesErr);
    }
    const emailsToSent = [];
    if(!lodash.isEmpty(unsubscribes)) {
      const unsubscribeGroupByUser = lodash.groupBy(unsubscribes, "userId");
      async.each(userIds, (userId, userIdCB) => {
        const emailQueueForUser = emailQueueGroupByUser[userId];
        const unsubscribeForUser = unsubscribeGroupByUser[userId];
        const personIdsForUser = lodash.map(unsubscribeForUser, "personId");
        const emailsToSentForUser = lodash.filter(emailQueueForUser,
            function(o) {
          return !lodash.includes(personIdsForUser, o.personId);
        });
        lodash(emailsToSentForUser).forEach(function(emailToSentForUser) {
          emailsToSent.push(emailToSentForUser);
        });
        userIdCB(null);
      }, (error) => {
        if(error) {
          console.error("Error while Filtering Unsubscribed Person", error);
          callback(null, emailQueue);
        } else {
          const emailQueueNotToSent = lodash.differenceBy(
                emailQueue, emailsToSent, "id");
          const reason = constants.default.PERSON_UNSUBSCRIBED;
          const stoppedBy = constants.default.SYSTEM;
          const isError = false;
          updateStoppedFlag(emailQueueNotToSent, stoppedBy, isError, reason,
              function(error) {
            if(error) {
              console.error("Error while Update Unsubscribed Emails", error);
            }
            callback(null, emailsToSent);
          });
        }
      });
    } else {
      return callback(null, emailQueue);
    }
  });
}

/**
 * Method to Filter Campaign by statusCode
 *
 * @param  {[Campaign]}   campaigns
 * @param  {[Object]}   groupedEmailQueue
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function filterCampaignByStatus(emailQueue, campaigns, groupedEmailQueue,
      callback) {
  const campaignsNotToRun = lodash.filter(campaigns, function(o) {
    return (o.statusCode !== statusCodes.default.readyToSend)
        && (o.statusCode !== statusCodes.default.executingCampaign);
  });

  let emailsStopped = lodash.flatMap(campaignsNotToRun, function(o) {
    let isStatusStopped =
      (o.statusCode === statusCodes.default.campaignStopped);
    return isStatusStopped ? groupedEmailQueue[o.id] : null;
  });
  emailsStopped = lodash.filter(emailsStopped, function(o) {
    return (o !== null);
  });

  let emailQueueToStop = lodash.flatMap(campaignsNotToRun, function(o) {
    return groupedEmailQueue[o.id];
  });
  emailQueueToStop = lodash.differenceBy(emailQueueToStop, emailsStopped, "id");

  async.parallel([
    function(errorQueueCB) {
      const stoppedBy = constants.default.SYSTEM;
      const isError = true;
      const reason = constants.default.STATUS_NOT_SUPPORTED;
      updateStoppedFlag(emailQueueToStop, stoppedBy, isError, reason,
          function(error) {
        errorQueueCB(error, emailQueueToStop);
      });
    },
    function(stoppedQueueCallback) {
      const stoppedBy = constants.default.USER;
      const isError = false;
      const reason = constants.default.USER_STOPPED_CAMPAIGN;
      updateStoppedFlag(emailsStopped, stoppedBy, isError, reason,
          function(error) {
        stoppedQueueCallback(error, emailsStopped);
      });
    }
  ], function(err, results) {
    let emailQsStopped = lodash.unionBy(emailsStopped, emailQueueToStop, "id");
    emailQueue = lodash.differenceBy(emailQueue, emailQsStopped, "id");
    callback(null, emailQueue, campaigns, groupedEmailQueue);
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
      console.error("waterfallErr: " + err);
    }
    mailSenderCB(null);
  });
}

/**
 * Method to Encode Email Subject
 * @param  {String} subject Email Subject
 * @return {String}   Encode Email Subject
 * @author Syed Sulaiman M
 */
function encodeSubject(subject) {
  let encSubject = new Buffer(subject).toString("base64");
  return "=?utf-8?B?" + encSubject + "?=";
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
  emailLines.push("Subject: " + encodeSubject(mailContent.mailSubject));
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

  let resource = {
    raw: base64EncodedEmail
  };
  if(emailQueue.threadId) {
    resource.threadId = emailQueue.threadId;
  }
  gmailClass.users.messages.send({
    auth: oauth2Client,
    userId: mailContent.userDetails.email.value,
    resource: resource
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
            (tokenHandlerErr, userIdentity) => {
              App.userIdentity.updateCredentials(userIdentity,
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
    updateSentMailBox.bind(null, emailQueue, mailContent, sentMailResp),
    updateCampaignLastRunAt.bind(null, emailQueue, mailContent, sentMailResp)
  ],
  function(err, results) {
    if (err) {
      console.error("Error while Updating related tables: " + err);
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
  App.campaign.getCampaignListForPerson(emailQueue.campaignId,
      emailQueue.personId, function(err, lists) {
      async.each(lists, (list, listCB) => {
        App.listMetric.findByListIdAndCampaignId(
            list.id, emailQueue.campaignId, (err, listMetric) => {
          let listMetricInst = {};
          listMetricInst.sentEmails = 1;
          listMetricInst.listId = list.id;
          listMetricInst.campaignId = emailQueue.campaignId;
          if(listMetric) {
            listMetricInst = listMetric;
            listMetricInst.sentEmails = ++listMetric.sentEmails;
          }
          App.listMetric.upsert(listMetricInst, function(err, response) {
            if (err) {
              console.error("Error in updating List Metric", err);
            }
            listCB(null, response);
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
 * Update Campaign Last Run At
 *
 * @param  {Object} emailQueue
 * @param  {Object} mailContent
 * @param  {Object} sentMailResp
 * @param  {Function} createAuditCB
 * @author Syed Sulaiman M
 */
function updateCampaignLastRunAt(emailQueue, mailContent, sentMailResp,
    updateCampaignCB) {
  App.campaign.findById(emailQueue.campaignId, function(err, campaign) {
    campaign.updateAttribute("lastRunAt", new Date(),
        function(err, updatedCampaign) {
      updateCampaignCB(null, emailQueue, mailContent, sentMailResp);
    });
  });
}

module.exports = {
  getEmailQueue: getEmailQueue,
  generateAndSendEmail: generateAndSendEmail
};
