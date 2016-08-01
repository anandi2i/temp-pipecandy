"use strict";

import async from "async";
import constants from "../../server/utils/constants";
import lodash from "lodash";
import logger from "../../server/log";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(InboxMail) {

  /**
   * Find Inbox Mail By User Id and Thread Id
   * @param  {Number}   userId
   * @param  {Number}   threadId
   * @param  {Function} callback
   * @return {SentMailBox}
   * @author Syed Sulaiman M
   */
  InboxMail.findByUserIdAndThreadId = (userId, threadId, callback) => {
    InboxMail.find({
      where: {
        userId: userId,
        threadId: threadId
      }
    }, (inboxMailsErr, inboxMails) => {
      return callback(inboxMailsErr, inboxMails[0]);
    });
  };

  /**
   * update nlp class for mail
   * @param  {Object}   mailResponse
   * @param  {Function} callback
   */
  InboxMail.updateClass = (inboxMail, classification, callback) => {
    inboxMail.updateAttribute("class", classification,
        (updateErr, updatedData) => {
      return callback(updateErr, updatedData);
    });
  };

  /**
   * Method to save or update Inbox Mail Instance.
   * If already Instance availabel with the Thread Id the Instance will be
   * 		 updated otherwise created
   *
   * @param  {InboxMail}   inboxMail
   * @param  {Function} callback
   * @return {InboxMail} InboxMail Instance
   * @author Syed Sulaiman M
   */
  InboxMail.saveOrUpdate = (inboxMail, callback) => {
    InboxMail.find({
      where: {
        threadId: inboxMail.threadId
      }
    }, (inboxMailsErr, inboxMails) => {
      if(inboxMailsErr) {
        logger.error("Error while getting inbox mail for thread id ",
            inboxMail.threadId, inboxMailsErr);
        return callback(inboxMailsErr);
      }
      let inboxMailToUpdate = inboxMails[0];
      if(inboxMailToUpdate) {
        const one = 1;
        inboxMail.count = inboxMailToUpdate.count + one;
        inboxMailToUpdate.updateAttributes(inboxMail,
              (err, updatedInboxMail) => {
          return callback(null, updatedInboxMail);
        });
      } else {
        InboxMail.create(inboxMail, (err, inboxMailInst) => {
          if(err) {
            logger.error("Error while creating inbox Entry", err);
          }
          return callback(null, inboxMailInst);
        });
      }
    });
  };

  /**
   * Method to get Latest Read Message from User Inbox
   * @param  {Number}   userId
   * @param  {Function} callback
   * @return {InboxMail} Latest Inbox Mail for User
   * @author Syed Sulaiman M
   */
  InboxMail.getLatestResponse = (userId, callback) => {
    InboxMail.findOne({
      where: {
        "userId": userId
      },
      order: "receivedDate desc"
    }, (inboxMailErr, inboxMail) => {
      if(inboxMailErr) {
        logger.error("Error while getting InboxMail", {
            error: inboxMailErr,
            stack: inboxMailErr.stack,
            input: {userId:userId}
        });
        return callback(inboxMailErr);
      }
      return callback(null, inboxMail);
    });
  };

  InboxMail.remoteMethod(
    "inboxMails", {
      description: "Get Inbox Mails",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "campaignId", type: "number"},
        {arg: "classification", type: "string"},
        {arg: "start", type: "number"},
        {arg: "limit", type: "number"}
      ],
      returns: {arg: "InboxMail", type: "array", root: true},
      http: {verb: "get", path: "/campaign/:campaignId/:classification"}
    }
  );
  /**
   * Method to return inbox mails
   * @param  {Object}   ctx
   * @param  {Number}   campaignId
   * @param  {String}   classification - [all, bounced, out-of-office, actionalble, nurture, negative]
   * @param  {Number}   start
   * @param  {Number}   limit
   * @param  {Function} callback
   * @return {[InboxMail]} list of InboxMail
   */
  InboxMail.inboxMails = (ctx, campaignId, classification, start, limit,
        callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit,
        classification);
    if (errorMessage) {
      return callback(errorMessage);
    }
    let whereQry = {};
    if(classification === "all") {
      whereQry = {
        and: [
          {campaignId: campaignId},
          {isMailReceived: true}
        ]};
    } else {
      whereQry = {
        and: [
          {campaignId: campaignId},
          {isMailReceived: true},
          {class: classification}
        ]};
    }
    InboxMail.find({
      include: "person",
      where: whereQry,
      order: "receivedDate DESC",
      limit: limit,
      skip: start
    }, (inboxMailsErr, inboxMails) => {
      if (inboxMailsErr) {
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      let responses = [];
      async.each(inboxMails, (inboxMail, inboxMailCB) => {
        var inboxMailJSON = inboxMail.toJSON();
        let response = JSON.parse(JSON.stringify(inboxMail));
        response.person = {
          firstName: inboxMailJSON.person.firstName,
          middleName: inboxMailJSON.person.middleName,
          lastName: inboxMailJSON.person.lastName,
          email: inboxMailJSON.person.email,
          timeZone: inboxMailJSON.person.time_zone
        };
        responses.push(response);
        inboxMailCB(null);
      }, (error) => {
        return callback(null, responses);
      });
    });
  };

  InboxMail.remoteMethod(
    "updateClassification", {
      description: "Update Inbox Mails Classification",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "inboxIds", type: "array", http: {source: "body"}},
        {arg: "classification", type: "string"}
      ],
      returns: {arg: "InboxMail", type: "array", root: true},
      http: {verb: "put", path: "/:classification"}
    }
  );

  /**
   * API to Update Mail Classification
   * @param  {Number}   id InboxMail Id
   * @param  {String}   classification
   * @param  {Function} callback
   * @return {InboxMail} Updated InboxMail Class
   * @author Syed Sulaiman M
   */
  InboxMail.updateClassification = (ctx, inboxIds, classification,
      callback) => {
    if(!constants.CLASSIFICATIONS.includes(classification)) {
      const errorMessage = errorMessages.INVALID_CLASSIFICATION;
      return callback(errorMessage);
    }
    let updatedInboxMails = [];
    async.each(inboxIds, (id, inboxCB) => {
      InboxMail.findById(id, (inboxMailErr, inboxMail) => {
        if(inboxMailErr) {
          logger.error("Error finding InboxMail",
            {error: inboxMailErr, stack: inboxMailErr.stack, input:
            {inboxMailId:ids, classification:classification}});
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        if(!inboxMail) {
          const errorMessage = errorMessages.INVALID_INBOX_MAIL_ID;
          return callback(errorMessage);
        }
        async.parallel([
          async.apply(InboxMail.updateClass, inboxMail, classification),
          async.apply(InboxMail.app.models.MailResponse.updateUserClassByMailId,
            inboxMail.mailId, classification),
          async.apply(InboxMail.updateMetricForClassification, inboxMail,
            classification, inboxMail.class)
        ], (err, results) => {
          if(err) {
            logger.error("Error updating Email Class",
              {error: err, stack: err.stack, input:
              {inboxMailId:ids, classification:classification}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return callback(errorMessage);
          }
          let updatedInboxMail = results[0]; // Result of First Function
          updatedInboxMails.push(updatedInboxMail);
          inboxCB(null);
        });
      });
    }, (err) => {
      if(err) {
        logger.error("Error updating Email Class",
          {error: err, stack: err.stack, input:
          {inboxMailId:ids, classification:classification}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      return callback(null, updatedInboxMails);
    });
  };

  /**
   * Method to update List and Campaign Metrics
   * @param  {InboxMail}   inboxMail
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  InboxMail.updateMetricForClassification = (inboxMail, classification,
      oldClassification, callback) => {
    async.parallel([
      async.apply(updateCampaignMetricClassCount, inboxMail, classification,
        oldClassification),
      async.apply(updateListMetricClassCount, inboxMail, classification,
        oldClassification)
    ], (err, results) => {
      if(err) {
        logger.error("Error updating Email Class",
          {error: err, stack: err.stack, input:
          {inboxMailId:inboxMail.id, classification:classification}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      callback(null, results);
    });
  };

  /**
   * Method to update List and Campaign Metrics for Responded Count
   * @param  {InboxMail}   inboxMail
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  InboxMail.updateMetricForResponded = (inboxMail, callback) => {
    InboxMail.app.models.MailResponse.findByThreadId(inboxMail.threadId,
      (mailResponsesErr, mailResponses) => {
        if(mailResponsesErr) {
          logger.error("Error getting MailResponse",
            {error: mailResponsesErr, stack: mailResponsesErr.stack, input:
            {personId:inboxMail.threadId}});
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        if(!lodash.isEmpty(mailResponses)) {
          mailResponses = lodash.filter(mailResponses, (o) => {
            return !o.labels.includes("SENT");
          });
          const one = 1;
          if(mailResponses.length === one) {
            async.parallel([
              async.apply(updateCampaignMetricRespondedCount, inboxMail),
              async.apply(updateListMetricRespondedCount, inboxMail)
            ], (err, results) => {
              if(err) {
                logger.error("Error updating Metric for Responded Count",
                  {error: err, stack: err.stack, input:
                  {inboxMailId:inboxMail.id}});
                const errorMessage = errorMessages.SERVER_ERROR;
                return callback(errorMessage);
              }
              callback(null, results);
            });
          } else {
            return callback(null);
          }
        } else {
          return callback(null);
        }
    });
  };

  /**
   * Update Campaign Metric Classification Count
   * @param  {InboxMail}   inboxMail
   * @param  {Function} callback
   * @return {CampaignMetric}
   * @author Syed Sulaiman M
   */
  const updateCampaignMetricClassCount = (inboxMail, classification,
      oldClassification, callback) => {
    InboxMail.app.models.campaignMetric.getMetricByCampaignId(
        inboxMail.campaignId, (campaignMetricErr, campaignMetric) => {
      if(campaignMetricErr) {
        logger.error("Error updating Email Class",
          {error: campaignMetricErr, stack: campaignMetricErr.stack, input:
          {campaignId:inboxMail.campaignId}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if(campaignMetric && (oldClassification !== classification)) {
        let properties = {};
        const zero = 0, one = 1;
        let colName = getColumnNameFromClassification(oldClassification);
        let value = campaignMetric[colName];
        if(value > zero) properties[colName] = value - one;
        colName = getColumnNameFromClassification(classification);
        value = campaignMetric[colName];
        properties[colName] = value + one;
        InboxMail.app.models.campaignMetric.updateProperties(
            campaignMetric, properties, (updateErr, updatedInst) => {
          if(updateErr) {
            logger.error("Error updating Campaign Metric ",
              {error: updateErr, stack: updateErr.stack, input:
              {campaignMetricId:campaignMetric.id}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return callback(errorMessage);
          }
          return callback(null, updatedInst);
        });
      } else {
        return callback(null);
      }
    });
  };

  /**
   * Update Campaign Metric Responded Count
   * @param  {InboxMail}   inboxMail
   * @param  {Function} callback
   * @return {CampaignMetric}
   * @author Syed Sulaiman M
   */
  const updateCampaignMetricRespondedCount = (inboxMail, callback) => {
    InboxMail.app.models.campaignMetric.getMetricByCampaignId(
      inboxMail.campaignId, (campaignMetricErr, campaignMetric) => {
      if(campaignMetricErr) {
        logger.error("Error updating Email Class",
          {error: campaignMetricErr, stack: campaignMetricErr.stack,
          input: {campaignId:inboxMail.campaignId}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if(campaignMetric) {
        let properties = {
          responded: ++campaignMetric.responded
        };
        InboxMail.app.models.campaignMetric.updateProperties(
            campaignMetric, properties, (updateErr, updatedInst) => {
          if(updateErr) {
            logger.error("Error updating Campaign Metric ",
              {error: updateErr, stack: updateErr.stack, input:
              {campaignMetricId:campaignMetric.id}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return callback(errorMessage);
          }
          return callback(null, updatedInst);
        });
      }
    });
  };

  /**
   * Update List Metric Classification Count
   * @param  {Number}   campaignId
   * @param  {Number}   personId
   * @param  {Function} callback
   * @return {[ListMetric]}
   * @author Syed Sulaiman M
   */
  const updateListMetricClassCount = (inboxMail, classification,
      oldClassification, callback) => {
    InboxMail.app.models.campaign.getCampaignListForPerson(
        inboxMail.campaignId, inboxMail.personId, (listsErr, lists) => {
      let listMetrics = [];
      async.each(lists, (list, listCB) => {
        InboxMail.app.models.listMetric.findByListIdAndCampaignId(
            list.id, inboxMail.campaignId, (err, listMetric) => {
          if(err) {
            logger.error("Error getting List Metric ",
              {error: err, stack: err.stack, input:
              {listId:list.id}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return listCB(errorMessage);
          }
          if(listMetric && (oldClassification !== classification)) {
            let properties = {};
            const zero = 0, one = 1;
            let colName = getColumnNameFromClassification(oldClassification);
            let value = listMetric[colName];
            if(value > zero) properties[colName] = value - one;
            colName = getColumnNameFromClassification(classification);
            value = listMetric[colName];
            properties[colName] = value + one;
            InboxMail.app.models.listMetric.updateProperties(
                listMetric, properties, (updateErr, updatedInst) => {
              if(updateErr) {
                logger.error("Error updating List Metric ",
                  {error: updateErr, stack: updateErr.stack, input:
                  {listMetricId:listMetric.id}});
                const errorMessage = errorMessages.SERVER_ERROR;
                return listCB(errorMessage);
              }
              listMetrics.push(updatedInst);
              return listCB(null);
            });
          } else {
            return listCB(null);
          }
        });
      }, (updateErr) => {
        if(updateErr) {
          logger.error("Error updating List Metric ",
            {error: updateErr, stack: updateErr.stack, input:
            {campaignId:inboxMail.campaignId, personId:inboxMail.personId}});
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        return callback(null, listMetrics);
      });
    });
  };

  /**
   * Update List Metric Classification Count
   * @param  {Number}   campaignId
   * @param  {Number}   personId
   * @param  {Function} callback
   * @return {[ListMetric]}
   * @author Syed Sulaiman M
   */
  const updateListMetricRespondedCount = (inboxMail, callback) => {
    InboxMail.app.models.campaign.getCampaignListForPerson(
        inboxMail.campaignId, inboxMail.personId, (listsErr, lists) => {
      let listMetrics = [];
      async.each(lists, (list, listCB) => {
        InboxMail.app.models.listMetric.findByListIdAndCampaignId(
            list.id, inboxMail.campaignId, (err, listMetric) => {
          if(err) {
            logger.error("Error getting List Metric ",
              {error: err, stack: err.stack, input:
              {listId:list.id}});
            const errorMessage = errorMessages.SERVER_ERROR;
            return listCB(errorMessage);
          }
          if(listMetric) {
            let properties = {
              responded: ++listMetric.responded
            };
            InboxMail.app.models.listMetric.updateProperties(
                listMetric, properties, (updateErr, updatedInst) => {
              if(updateErr) {
                logger.error("Error updating List Metric ",
                  {error: updateErr, stack: updateErr.stack, input:
                  {listMetricId:listMetric.id}});
                const errorMessage = errorMessages.SERVER_ERROR;
                return listCB(errorMessage);
              }
              listMetrics.push(updatedInst);
              return listCB(null);
            });
          } else {
            return listCB(null);
          }
        });
      }, (updateErr) => {
        if(updateErr) {
          logger.error("Error updating List Metric ",
            {error: updateErr, stack: updateErr.stack, input:
            {campaignId:inboxMail.campaignId, personId:inboxMail.personId}});
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        return callback(null, listMetrics);
      });
    });
  };

  /**
   * Method To validate mail request
   * @param  {Number} campaignId
   * @param  {Number} start
   * @param  {Number} limit
   * @param  {String} classification Mail Class
   * @return {Object}
   */
  const validateMailRequest = (campaignId, start, limit, classification) => {
    const zero = 0;
    let errorMessage = null;
    if (campaignId <= zero) {
      errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
    } else if (start < zero) {
      errorMessage = errorMessages.INVALID_START;
    } else if (limit <= zero) {
      errorMessage = errorMessages.INVALID_LIMIT;
    } else if(!constants.CLASSIFICATIONS.includes(classification) &&
        classification !== "all") {
      errorMessage = errorMessages.INVALID_CLASSIFICATION;
    }
    return errorMessage;
  };

  /**
   * Return Column Name for Metric Table to the corresponding classification
   *
   * @param  {String} classification
   * @return {String}   Column Name of Metric Table
   * @author Syed Sulaiman M
   */
  const getColumnNameFromClassification = (classification) => {
    let columnName = null;
    if (classification === "bounced") {
      columnName = "bounced";
    } else if (classification === "out-of-office") {
      columnName = "outOfOffice";
    } else if (classification === "actionable") {
      columnName = "actionable";
    } else if(classification === "nurture") {
      columnName = "nurture";
    } else if(classification === "negative") {
      columnName = "negative";
    }
    return columnName;
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   * @author Syed Sulaiman M
   */
  InboxMail.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
