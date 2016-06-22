import async from "async";
import lodash from "lodash";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

module.exports = function(CampaignAudit) {

  CampaignAudit.remoteMethod(
    "inboxMails", {
      description: "Get Inbox Mails",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "campaignId",
        type: "number"
      }, {
        arg: "start",
        type: "number"
      }, {
        arg: "limit",
        type: "number"
      }],
      returns: {
        arg: "MailResponse",
        type: "array",
        root: true
      },
      http: {
        verb: "get",
        path: "/inboxMails/:campaignId/:start/:limit"
      }
    }
  );
  /**
   * Method to return inbox mails
   * @param  {Object}   ctx
   * @param  {Number}   campaignId
   * @param  {Number}   start
   * @param  {Number}   limit
   * @param  {Function} callback
   * @return {[Object]} list of Mail Response
   */
  CampaignAudit.inboxMails = (ctx, campaignId, start, limit, callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit);
    if (errorMessage) {
      return ctx.res.status(errorMessage.code).send(errorMessage.message);
    }
    CampaignAudit.find({
      where: {
        campaignId: campaignId
      }
    }, (campaignAuditsErr, campaignAudits) => {
      let campaignThreadIds = [];
      if (!lodash.isEmpty(campaignAudits)) {
        async.filter(campaignAudits, (campaignAudit, filterCB) => {
          filterCB(!lodash.isEmpty(campaignAudit.threadId));
        }, (results) => {
          campaignAudits = results;
        });
        async.map(campaignAudits, (campaignAudit, mapCallback) => {
          mapCallback(null, campaignAudit.threadId);
        }, (threadIdsErr, threadIds) => {
          campaignThreadIds = threadIds;
        });
      }
      if (!lodash.isEmpty(campaignThreadIds)) {
        CampaignAudit.app.models.MailResponse.find({
          where: {
            "threadId": {
              inq: campaignThreadIds
            }
          },
          order: "createdAt DESC",
          limit: limit,
          skip: start
        }, (mailResponsesErr, mailResponses) => {
          let inboxMails = {};
          const zero = 0;
          if (start === zero) {
            CampaignAudit.app.models.MailResponse.count( (countErr, count) => {
              inboxMails.count = count;
              inboxMails.mails = mailResponses;
              return callback(null, inboxMails);
            });
          } else {
            inboxMails.mails = mailResponses;
            return callback(null, inboxMails);
          }
        });
      } else {
        const errorMessage = errorMessages.NO_EMAILS_FOUND;
        return ctx.res.status(errorMessage.code).send(errorMessage.message);
      }
    });
  };

  CampaignAudit.remoteMethod(
    "sentMails", {
      description: "Get Sent Mails",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "campaignId",
        type: "number"
      }, {
        arg: "start",
        type: "number"
      }, {
        arg: "limit",
        type: "number"
      }],
      returns: {
        arg: "CampaignAudit",
        type: "array",
        root: true
      },
      http: {
        verb: "get",
        path: "/sentMails/:campaignId/:start/:limit"
      }
    }
  );
  /**
   * Method to return sent mails
   * @param  {Object}   ctx
   * @param  {Number}   campaignId
   * @param  {Number}   start
   * @param  {Number}   limit
   * @param  {Function} callback
   * @return {[Object]} list of Campaign Audit
   */
  CampaignAudit.sentMails = (ctx, campaignId, start, limit, callback) => {
    let errorMessage = validateMailRequest(campaignId, start, limit);
    if (errorMessage) {
      return ctx.res.status(errorMessage.code).send(errorMessage.message);
    }
    CampaignAudit.find({
      where: {
        campaignId: campaignId
      },
      order: "createdAt DESC",
      limit: limit,
      skip: start
    }, (campaignAuditsErr, campaignAudits) => {
      if (!lodash.isEmpty(campaignAudits)) {
        let sentMails = {};
        const zero = 0;
        if (start === zero) {
          CampaignAudit.count( (countErr, count) => {
            sentMails.count = count;
            sentMails.mails = campaignAudits;
            return callback(null, sentMails);
          });
        } else {
          sentMails.mails = campaignAudits;
          return callback(null, sentMails);
        }
      } else {
        const errorMessage = errorMessages.NO_EMAILS_FOUND;
        return ctx.res.status(errorMessage.code).send(errorMessage.message);
      }
    });
  };

  /**
   * Method To validate mail request
   * @param  {Number} campaignId
   * @param  {Number} start
   * @param  {Number} limit
   * @return {Object}
   */
  const validateMailRequest = (campaignId, start, limit) => {
    const zero = 0;
    let errorMessage = null;
    if (campaignId <= zero) {
      errorMessage = errorMessages.INVALID_CAMPAIGN_ID;
    } else if (start < zero) {
      errorMessage = errorMessages.INVALID_START;
    } else if (limit <= zero) {
      errorMessage = errorMessages.INVALID_LIMIT;
    }
    return errorMessage;
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  CampaignAudit.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
