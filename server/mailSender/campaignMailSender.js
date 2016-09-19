"use strict";

var googleAuth = require("google-auth-library");
var google = require("googleapis");
var striptags = require("striptags");
var googleTokenHandler = require("../../server/utils/googleTokenHandler");
var async = require("async");
var lodash = require("lodash");
var app = require("../../server/server.js");
var statusCodes = require("../../server/utils/status-codes");
var constants = require("../../server/utils/constants");
require("console-stamp")(console, {pattern : constants.default.TIME_FORMAT});

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
      updateFailedMetricCount,
      generateCredentials
    ],
    function(error) {
      if (error) {
        console.error("Error while Generate and Send Mail: " + error);
        return callback(error);
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
function filterEmailQueue(queuedMails, filterEmailCB) {
  async.waterfall([
    function getReqParams(getReqParamsCB) {
      getReqParamsCB(null, queuedMails);
    },
    filterEmailQueueByStatus,
    filterUnsubscribePerson
  ],
  function(err, result) {
    filterEmailCB(null, queuedMails, result);
  });
}

/**
 * For each user pick the gmail credentials from useridentity tabe and load it
 * in tempCacheUserCredentials and then generate mail
 * @param emailQueue
 * @return void
 */
function generateCredentials(emailQueue, generateCredentialsCB) {
  async.eachSeries(emailQueue, function(emailQueueEntry, emailQueueCB) {
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
 * @param  {String}   stoppedBy
 * @param  {Boolean}   isError
 * @param  {String}   reason
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function updateStoppedFlag(emailQueueToStop, stoppedBy, isError, reason,
    callback) {
  async.each(emailQueueToStop, function(emailQueueInst, emailQueueInstCB) {
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
 * Method to Filter EmailQueue by statusCode
 *
 * @param  {[Campaign]}   campaigns
 * @param  {[Object]}   grpdEmailQueueByCamp
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function filterEmailQueueByStatus(emailQueue, callback) {
  const zero = 0;

  let campaignMails = lodash.filter(emailQueue, (o) => {
    return (!o.followUpId) ? true : false;
  });
  let followUpMails = lodash.filter(emailQueue, (o) => {
    return (o.followUpId) ? true : false;
  });

  let grpdEmailQueueByCamp = lodash.groupBy(campaignMails, "campaignId");
  let campaignIds = lodash.keys(grpdEmailQueueByCamp);
  campaignIds = lodash.filter(campaignIds, (o) => { return (o !== null); });
  campaignIds = lodash.isEmpty(campaignIds) ? [zero] : campaignIds;

  let grpdEmailQueueByFollowUp = lodash.groupBy(followUpMails, "followUpId");
  let followUpIds = lodash.keys(grpdEmailQueueByFollowUp);
  followUpIds = lodash.filter(followUpIds, (o) => { return (o !== null); });
  followUpIds = lodash.isEmpty(followUpIds) ? [zero] : followUpIds;

  async.parallel({
    campaigns: async.apply(App.campaign.getCampaigns, campaignIds),
    followUps: async.apply(App.followUp.getFollowUps, followUpIds)
  }, function(err, result) {
    async.parallel({
      filteredQByCamp : async.apply(filterCampaignByStatus,
          emailQueue, result.campaigns, grpdEmailQueueByCamp),
      filteredQByFollowUp: async.apply(filterFollowUpByStatus,
          emailQueue, result.followUps, grpdEmailQueueByFollowUp)
    },
    function(err, result) {
      emailQueue = lodash.intersectionBy(result.filteredQByCamp,
        result.filteredQByFollowUp, "id");
      callback(null, emailQueue);
    });
  });
}


/**
 * Method to Filter Out Unsubscribed Persons From Email List
 * @param  {[Object]}   emailQueue
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function filterUnsubscribePerson(emailQueue,
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
 * @param  {[EmailQueue]}   emailQueue
 * @param  {[Campaign]}   campaigns
 * @param  {[Object]}   grpdEmailQueueByCamp
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function filterCampaignByStatus(emailQueue, campaigns, grpdEmailQueueByCamp,
      callback) {
  const campaignsNotToRun = lodash.filter(campaigns, function(o) {
    return (o.statusCode !== statusCodes.default.readyToSend)
        && (o.statusCode !== statusCodes.default.executingCampaign)
        && (o.statusCode !== statusCodes.default.campaignResumed);
  });

  let emailsStopped = lodash.flatMap(campaignsNotToRun, function(o) {
    let isStatusStopped =
      (o.statusCode === statusCodes.default.campaignStopped);
    return isStatusStopped ? grpdEmailQueueByCamp[o.id] : null;
  });
  emailsStopped = lodash.filter(emailsStopped, function(o) {
    return (o !== null);
  });

  let emailQueueToStop = lodash.flatMap(campaignsNotToRun, function(o) {
    return grpdEmailQueueByCamp[o.id];
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
    callback(null, emailQueue);
  });
}

/**
 * Method to Filter FollowUp by statusCode
 *
 * @param  {[EmailQueue]}   emailQueue
 * @param  {[FollowUp]}   followUps
 * @param  {[Object]}   grpdEmailQueueByCamp
 * @param  {Function} callback
 * @author Syed Sulaiman M
 */
function filterFollowUpByStatus(emailQueue, followUps, grpdEmailQueueByFollowUp,
      callback) {
  const followUpsNotToRun = lodash.filter(followUps, function(o) {
    return (o.statusCode !== statusCodes.default.executingFollowUp)
      && (o.statusCode !== statusCodes.default.followUpResumed);
  });

  let emailsStopped = lodash.flatMap(followUpsNotToRun, function(o) {
    let isStatusStopped =
      (o.statusCode === statusCodes.default.followUpStopped);
    return isStatusStopped ? grpdEmailQueueByFollowUp[o.id] : null;
  });
  emailsStopped = lodash.filter(emailsStopped, function(o) {
    return (o !== null);
  });

  let emailQueueToStop = lodash.flatMap(followUpsNotToRun, function(o) {
    return grpdEmailQueueByFollowUp[o.id];
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
    callback(null, emailQueue);
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
    if (err) console.error("waterfallErr: " + err);
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
  var clientSecret = app.get("googleCredentials").installed.client_secret;
  var clientId = app.get("googleCredentials").installed.client_id;
  var redirectUrl = app.get("googleCredentials").installed.redirect_uris[0];

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
      } else {
        return sendEmailCB(err);
      }
    } else {
      delete tempCacheUserCredentials[mailContent.userDetails.userid];
      App.emailQueue.destroyById(mailContent.mailId, function(err, data) {
        if (err) {
          return sendEmailCB(err);
        }
        console.log(results);
        return sendEmailCB(null, emailQueue, mailContent, results);
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
 * @author Syed Sulaiman M, Rahul Khandelwal(modified)
 */
function updateRelatedTables(emailQueue, mailContent, sentMailResp,
      updateRelatedTablesCB) {
  const isSent = true;
  async.parallel({
    audit: createAudit.bind(null, emailQueue, mailContent, sentMailResp),
    campaignMetric:
        updateCampaignMetric.bind(null, emailQueue, mailContent,
          sentMailResp, isSent),
    listMetric:
        updateListMetric.bind(null, emailQueue, mailContent,
           sentMailResp, isSent),
    sentMailBox:
        updateSentMailBox.bind(null, emailQueue, mailContent, sentMailResp),
    followUpMetric:
        updateFollowUpMetric.bind(null, emailQueue, mailContent,
          sentMailResp, isSent),
    followUps:
        App.followUp.getFollowUpsCampaignId.bind(null, emailQueue.campaignId)
  }, function(err, results) {
    if (err) {
      console.error("Error while Updating related tables: " + err);
    }
    async.parallel({
      campaign: async.apply(updateCampaign,
          emailQueue, results.campaignMetric, results.followUpMetric,
          results.followUps),
      followUp: async.apply(updateFollowUp,
          emailQueue, results.campaignMetric, results.followUpMetric)
    }, function(err, results) {
      if (err) console.error("Error while Updating related tables: " + err);
      updateRelatedTablesCB(null);
    });
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
  campaignAuditInst.unSubscribeToken = emailQueue.unSubscribeToken;
  campaignAuditInst.mailId = sentMailResp.id;
  campaignAuditInst.threadId = sentMailResp.threadId;
  App.campaignAudit.create(campaignAuditInst, function(err, response) {
    createAuditCB(null, response);
  });
}

/**
 * Update Campaign Metric for sent mail
 * @param  {Object} emailQueue     Email Queue Object
 * @param  {Object} mailContent    Sent Mail Content
 * @param  {Object} sentMailResp   Sent Mail Response
 * @param  {Boolean} isSent   Sent or Failed
 * @param  {Function} updateMetricCB callback function
 * @author Syed Sulaiman M, Rahul Khandelwal(modified)
 */
function updateCampaignMetric(emailQueue, mailContent, sentMailResp,
   isSent, updateMetricCB) {
  if(emailQueue.followUpId) return updateMetricCB(null);
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
      if (isSent) {
        campaignMetricInst.sentEmails = ++campaignMetric[0].sentEmails;
      } else {
        if(emailQueue.isStopped &&
          emailQueue.stoppedBy !== constants.default.USER){
          campaignMetricInst.failedEmails = ++campaignMetric[0].failedEmails;
        }
      }
    }
    App.campaignMetric.upsert(campaignMetricInst, function(err, response) {
      if (err) {
        console.error("Error in updating Campaign Metric", err);
      }
      updateMetricCB(null, response);
    });
  });
}

/**
 * Update Campaign Metric for sent mail
 * @param  {Object} emailQueue     Email Queue Object
 * @param  {Object} mailContent    Sent Mail Content
 * @param  {Object} sentMailResp   Sent Mail Response
 * @param  {Function} updateMetricCB callback function
 * @author Syed Sulaiman M, Rahul Khandelwal(modified)
 */
function updateFollowUpMetric(emailQueue, mailContent, sentMailResp,
  isSent, updateMetricCB) {
  if(!emailQueue.followUpId) return updateMetricCB(null);
  let followUpMetricInst = {};
  followUpMetricInst.sentEmails = 1;
  followUpMetricInst.followUpId = emailQueue.followUpId;
  followUpMetricInst.campaignId = emailQueue.campaignId;
  App.followUpMetric.find({
    where: {
      followUpId: emailQueue.followUpId
    }
  }, (followUpMetricErr, followUpMetric) => {
    if (followUpMetricErr) {
      console.error("Error in updating FollowUp Metric", followUpMetricErr);
    }
    if (!lodash.isEmpty(followUpMetric)) {
      followUpMetricInst = followUpMetric[0];
      if (isSent) {
        followUpMetricInst.sentEmails = ++followUpMetric[0].sentEmails;
      } else {
        if(emailQueue.isStopped &&
          emailQueue.stoppedBy !== constants.default.USER){
          followUpMetricInst.failedEmails = ++followUpMetric[0].failedEmails;
        }
      }
    }
    App.followUpMetric.upsert(followUpMetricInst, function(err, response) {
      if (err) {
        console.error("Error in updating FollowUp Metric", err);
      }
      updateMetricCB(null, response);
    });
  });
}

/**
 * Update List Metric for sent mail
 * @param  {Object} emailQueue     Email Queue Object
 * @param  {Object} mailContent    Sent Mail Content
 * @param  {Object} sentMailResp   Sent Mail Response
 * @param  {Function} updateMetricCB callback function
 * @author Syed Sulaiman M, Rahul Khandelwal(modified)
 */
function updateListMetric(emailQueue, mailContent, sentMailResp,
  isSent, updateMetricCB) {
  if(emailQueue.followUpId) return updateMetricCB(null);
  App.campaign.getCampaignListForPerson(emailQueue.campaignId,
      emailQueue.personId, function(err, lists) {
    let updatedLists = [];
    async.each(lists, (list, listCB) => {
      App.listMetric.findByListIdAndCampaignId(
          list.id, emailQueue.campaignId, (err, listMetric) => {
        let listMetricInst = {};
        listMetricInst.sentEmails = 1;
        listMetricInst.listId = list.id;
        listMetricInst.campaignId = emailQueue.campaignId;
        if(listMetric) {
          listMetricInst = listMetric;
          if (isSent) {
            listMetricInst.sentEmails = ++listMetric.sentEmails;
          } else {
            if(emailQueue.isStopped &&
              emailQueue.stoppedBy !== constants.default.USER){
              listMetricInst.failedEmails = ++listMetric.failedEmails;
            }
          }
        }
        updatedLists.push(listMetricInst);
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
      return updateMetricCB(null, updatedLists);
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
    updateSentMailBoxCB(null, response);
  });
}

/**
 * Update Campaign Last Run At and Status
 *
 * @param  {Object} emailQueue
 * @param  {Object} mailContent
 * @param  {Object} sentMailResp
 * @param  {Function} createAuditCB
 * @author Syed Sulaiman M
 */
function updateCampaign(emailQueue, campaignMetric, followUpMetric, followUps,
    updateCampaignCB) {
  App.campaign.findById(emailQueue.campaignId, function(err, campaign) {
    let updateProperties = {
      lastRunAt: new Date()
    };
    let statusArray = [statusCodes.default.campaignSent,
      statusCodes.default.campaignStopped];
    lodash.times(constants.default.EIGHT, (index) => {
      ++index;
      let result = "followUpStopped-" + index;
      statusArray.push(statusCodes.default[result]);
      result = "followUpResumed-" + index;
      statusArray.push(statusCodes.default[result]);
    });
    let containsCheck = lodash.includes(statusArray, campaign.statusCode);
    if(!containsCheck) {
      updateProperties.statusCode = statusCodes.default.executingCampaign;
    }

    if(campaignMetric) {
      if(campaignMetric.assembled ===
          (campaignMetric.sentEmails + campaignMetric.failedEmails)) {
        updateProperties.isSent = true;
        let campStatus = statusCodes.default.campaignSent;
        if(!followUps)
          campStatus = statusCodes.default.campaignExecuted;
        updateProperties.statusCode = campStatus;
      }
    }
    if(followUpMetric) {
      let followUpsTmp = lodash.filter(followUps, (o) => {
        return (o.statusCode !== statusCodes.default.followUpSent)
          ? true : false;
      });
      if(followUpsTmp.length === constants.default.ONE
          && followUpsTmp[0].id === followUpMetric.followUpId) {
        if(followUpMetric.assembled ===
            (followUpMetric.sentEmails + followUpMetric.failedEmails)) {
          updateProperties.statusCode = statusCodes.default.campaignExecuted;
        }
      }
    }
    campaign.updateAttributes(updateProperties, function(err, updatedCampaign) {
      updateCampaignCB(null, updatedCampaign);
    });
  });
}

/**
 * Update FollowUp Status
 *
 * @param  {Object} emailQueue
 * @param  {CampaignMetric} campaignMetric
 * @param  {FollowUpMetric} followUpMetric
 * @param  {Function} updateFollowUpCB
 * @author Syed Sulaiman M
 */
function updateFollowUp(emailQueue, campaignMetric, followUpMetric,
    updateFollowUpCB) {
  if(!emailQueue.followUpId) return updateFollowUpCB(null);
  if(followUpMetric.assembled ===
      (followUpMetric.sentEmails + followUpMetric.failedEmails)) {
    App.followUp.findById(emailQueue.followUpId, function(err, followUp) {
      let updateProperties = {
        statusCode: statusCodes.default.followUpSent
      };
      followUp.updateAttributes(updateProperties,
          function(err, updatedFollowUp) {
        updateFollowUpCB(null, updatedFollowUp);
      });
    });
  } else {
    updateFollowUpCB(null);
  }
}

/**
 * Method to Update Failed Count in Metrics
 * @param  {Function} filterEmailCB callback function
 * @author Syed Sulaiman M, Rahul Khandelwal(modified)
 */
function updateFailedMetricCount(queuedMails, emailQueue, callback) {
  const filteredOutEmailQs = lodash.differenceBy(queuedMails, emailQueue, "id");
  if(lodash.isEmpty(filteredOutEmailQs)) return callback(null, emailQueue);
  const isSent = false;
  async.each(filteredOutEmailQs, (filteredOutEmail, filteredOutEmailCB) => {
    async.parallel({
      campaignMetric:
          updateCampaignMetric.bind(null, filteredOutEmail, null, null, isSent),
      listMetric:
          updateListMetric.bind(null, filteredOutEmail, null, null, isSent),
      followUpMetric:
          updateFollowUpMetric.bind(null, filteredOutEmail, null, null, isSent),
      followUps:
          App.followUp.getFollowUpsCampaignId.bind(null,
            filteredOutEmail.campaignId)
    }, function(err, results) {
      if (err) {
        console.error("Error while Updating related tables: " + err);
      }
      async.parallel({
        campaign: async.apply(updateCampaign,
            filteredOutEmail, results.campaignMetric, results.followUpMetric,
            results.followUps),
        followUp: async.apply(updateFollowUp,
            filteredOutEmail, results.campaignMetric, results.followUpMetric)
      }, function(err, results) {
        if (err) console.error("Error while Updating related tables: " + err);
        filteredOutEmailCB(null);
      });
    });
  }, (asyncErr) => {
    return callback(asyncErr, emailQueue);
  });
}

module.exports = {
  getEmailQueue: getEmailQueue,
  generateAndSendEmail: generateAndSendEmail
};
