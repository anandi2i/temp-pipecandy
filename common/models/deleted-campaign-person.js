"use strict";

import async from "async";
import lodash from "lodash";
import logger from "../../server/log";

module.exports = function(DeletedCampaignPerson) {

  /**
   * saves the person and campaignId for feature use before deleting a person
   * from a campaign
   *
   * @param  {[Array[Number]]}  ids  [emailQueueIds]
   * @param  {[number]}   userId   [current userId]
   * @param  {[EmailQueue]}   emails   [email objects from queue]
   * @param  {Function} callback [description]
   * @author Ramanavel Selvaraju
   */
  DeletedCampaignPerson.saveDeletedPeople = (ids, userId, emails, callback) => {
    async.each(emails, (email, emailCB) => {
      DeletedCampaignPerson.create({deletedBy: userId,
        campaignId: email.campaignId, personId: email.personId
      }, (createErr, obj) => {
        if(createErr) {
          logger.error({error: createErr, stack: createErr.stack,
                        input: {email: email}});
        }
        emailCB(null);
      });
    }, (eachErr) => {
      if(eachErr) {
        logger.error({error: eachErr, stack: eachErr.stack,
                      input: {ids: ids, userId: userId}});
      }
      return callback(eachErr, ids, userId, emails);
    });
  };

  /**
   * validating whether the person is eligible to generate
   * a email or not from assembler
   *
   * @param  {[Campaign]} campaign
   * @param  {[Person]} person
   * @param  {[function]} validateCB [callback]
   * @author Ramanavel Selvaraju
   */
  DeletedCampaignPerson.eligibilityCheck = (campaign, person, validateCB) => {
    DeletedCampaignPerson.find({where: {and:
      [{campaignId: campaign.id}, {personId: person.id}]}
    }, (findErr, deletedPerson) => {
      if(findErr) {
        logger.error({error: findErr, stack: findErr.stack,
                      input: {campaign: campaign, person: person}});
        return validateCB(findErr);
      }
      return validateCB(null, lodash.isEmpty(deletedPerson));
    });
  };

//observers
  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  DeletedCampaignPerson.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
