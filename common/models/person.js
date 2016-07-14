"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
const emptycount = 0;

module.exports = function(Person) {

  /**
   * Gets people using list object and checks for the eligibility to generate
   * the email or a followup email and pushing to the sending queue
   * @param  {[campaign]} campaign
   * @param  {[list]} list
   * @param  {[List]} listIds
   * @param  {[followup]} followup
   * @param  {[function]} getPoepleAndGenerateEmailCB [callback]
   * @author Ramanavel Selvaraju
   */
  Person.getPoepleAndGenerateEmail = (campaign, list, listIds, followup,
    getPoepleAndGenerateEmailCB) => {
    list.people((peopleFindErr, people) => {
      if (peopleFindErr) {
        logger.error("Error on fing the people using list", {
          list: list, listIds: listIds, followup: followup,
          error: peopleFindErr, stack: peopleFindErr.stack
        });
        return getPoepleAndGenerateEmailCB(peopleFindErr);
      }
      async.eachSeries(people, (person, peopleEachCB) => {
        validatePersonToGenerate(campaign, person,
          followup, (checkEmailExistsErr, isEligible) => {
            if (checkEmailExistsErr) {
              if(checkEmailExistsErr.name === "StatusMismatchError") {
                return getPoepleAndGenerateEmailCB(checkEmailExistsErr);
              }
              return peopleEachCB(checkEmailExistsErr);
            }
            if(!isEligible){
              return peopleEachCB(null);
            }
            Person.app.models.campaign.generateEmail(campaign, person,
              listIds, followup, (generateEmailErr) => {
                peopleEachCB(generateEmailErr);
              }); //campaign.generateEmail

          }); //emailQueue.checkEmailExists

      }, (asyncEachPeopleErr) => {
        return getPoepleAndGenerateEmailCB(asyncEachPeopleErr);
      }); //async.each
    }); //list.people
  };

  /**
   * Check the status code of campaign or a followup. If its not matching
   * the status code it will stop thecontent generation
   * checks in the unsubscribe model before generating the email
   * checks wether the person is eligible to generate email or a followup email
   * first checks wheter the email is already generated or not
   * then if followup object is there means it goes further to check the eligibility
   * of person using the campaignAudit table
   * returns true if eligible to generate
   * @param  {[type]}  campaign
   * @param  {[type]}  person
   * @param  {[type]}  followup
   * @param  {function} validateCB [callback]
   * @return {[Boolean]}
   * @author Ramanavel Selvaraju
   */
  const validatePersonToGenerate = (campaign, person, followup, validateCB) => {
    async.series({
      validateStatus: Person.app.models.campaign.validateStatus.bind(null,
                      campaign, followup),
      unsubscribed: Person.app.models.unsubscribe.eligibleCheck.bind(null,
                      campaign, person),
      eligible: isEligibleToGenerate.bind(null, campaign, person, followup)
    }, (seriesErr, results) => {
      if(seriesErr) {
        return validateCB(seriesErr);
      }
      return validateCB(seriesErr, results.unsubscribed && results.eligible);
    });
  };

  /**
   * checks wether the person is eligible to generate email or a followup email
   * first checks wheter the email is already generated or not
   * then if followup object is there means it goes further to check the eligibility
   * of person using the campaignAudit table
   * returns true if eligible to generate
   * @param  {[type]}  campaign
   * @param  {[type]}  person
   * @param  {[type]}  followup
   * @param  {function} isEligibleCB [callback]
   * @return {[Boolean]}
   * @author Ramanavel Selvaraju
   */
  const isEligibleToGenerate = (campaign, person, followup, isEligibleCB) => {
    //Todo : check for unsubscribe
    Person.app.models.emailQueue.checkEmailExists(campaign, followup, person,
      (checkEmailExistsErr, isEligible) => {
        if(checkEmailExistsErr || !followup || !isEligible){
          return isEligibleCB(checkEmailExistsErr, isEligible);
        }
        Person.app.models.campaignAudit.isEligibleForFollowup(campaign,
          person, followup, (isFollowupEligibleErr, isFollowupEligible) => {
            return isEligibleCB(isFollowupEligibleErr, isFollowupEligible);
        });
      });
  };

  /**
   * prepares person object with latest field values
   * @param  {[Campaign]} campaign
   * @param  {[Person]} person
   * @param  {[Array]} listIds
   * @param  {[type]} preparePersonWithExtraFieldsCB [callback]
   * @return {List[AdditionalFieldValue]}
   * @author Ramanavel Selvaraju
   */
  Person.preparePersonWithExtraFields = (campaign, person, listIds,
    preparePersonWithExtraFieldsCB) => {
    Person.app.models.additionalFieldValue.find({
      where: {
        personId: person.id,
        listId: {
          inq: listIds
        }
      },
      order: "updatedat DESC"
    }, (additionalFieldValueFindErr, fieldValues) => {
      let addtionalFields = lodash.uniqBy(fieldValues, "fieldId");
      personToFieldValues(person, addtionalFields);
      return preparePersonWithExtraFieldsCB(null, addtionalFields);
    });
  };

  /**
   * merges the person object with additionalFieldValue Object
   *
   * @param  {[Person]} person
   * @param  {List[AdditionalFieldValue]} addtionalFields
   * @return {List[AdditionalFieldValue]} addtionalFields
   * @author Ramanavel Selvaraju
   */
  let personToFieldValues = (person, addtionalFields) => {
    person.firstName ? addtionalFields.push({
      fieldId: 1,
      value: person.firstName
    }) : "";
    person.middleName ? addtionalFields.push({
      fieldId: 2,
      value: person.middleName
    }) : "";
    person.lastName ? addtionalFields.push({
      fieldId: 3,
      value: person.lastName
    }) : "";
    person.email ? addtionalFields.push({
      fieldId: 4,
      value: person.email
    }) : "";
    person.salutation ? addtionalFields.push({
      fieldId: 5,
      value: person.salutation
    }) : "";
    return addtionalFields;
  };

  /**
   * Returns the peopleList who are all having separate email template
   * @param  {[type]} campaign
   * @param  {[type]} individualTemplatePeopleCB
   * @author Ramanavel Selvaraju
   */
  Person.getIndividualTemplatePeople = (campaign,
    individualTemplatePeopleCB) => {
    Person.find({
        where: {
          campaignTemplate: {
            campaignId: campaign.id
          }
        }
      },
      function(err, individualTemplatePeople) {
        individualTemplatePeopleCB(err, individualTemplatePeople);
      });
  };


  Person.observe("before save", function(ctx, next) {
    //instance for entity creation
    //data for entity updation
    let instance = ctx.instance || ctx.data;
    instance.updatedAt = new Date();
    let companyName;
    if (instance.email) {
      companyName = instance.email.split("@")[1];
    } else {
      let error = new Error();
      error.message = "Email id is not found";
      error.name = "emailNotFound";
      next(error);
    }

    if (!companyName) {
      let error = new Error();
      error.message = "Email id is invalid";
      error.name = "InvalidEmail";
      next(error);
    }

    Person.app.models.Company.findOrCreate({
      "name": companyName
    }, (err, company) => {
      Person.app.models.Prospect.findOrCreate({
        "companyId": company.id
      }, (err, prospect) => {
        instance.prospectId = prospect.id;
        next();
      });
    });
  });

  Person.remoteMethod(
    "unsubscribe", {
      description: "Unsubscribe Person from User",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "id",
        type: "number",
        required: true,
        http: {
          source: "path"
        }
      }, {
        arg: "userId",
        type: "number",
        required: true,
        http: {
          source: "path"
        }
      }, {
        arg: "campaignId",
        type: "number",
        required: true,
        http: {
          source: "path"
        }
      }],
      returns: {
        arg: "person",
        type: "person",
        root: true
      },
      http: {
        verb: "get",
        path: "/:id/user/:userId/campaign/:campaignId/unsubscribe"
      }
    }
  );
  /**
   * Method to unsubscribe Person from User
   *
   * @param  {context}   ctx        [description]
   * @param  {Number}   personId   [description]
   * @param  {Number}   userId     [description]
   * @param  {Number}   campaignId [description]
   * @param  {Function} callback   [description]
   * @author Syed Sulaiman M
   */
  Person.unsubscribe = function(ctx, personId, userId, campaignId, callback) {
    async.waterfall([
      function getReqParams(getReqParamsCB) {
        getReqParamsCB(null, userId, personId, campaignId);
      },
      getCampaignAudit,
      getOrSaveUnsubscribe
    ], (error, result) => {
      if (error) {
        logger.error("Error while Unsubscribing Person ", personId,
              "for User", userId, error);
        return callback(error);
      }
      return callback(null, result);
    });
  };

  /**
   * Method to get Campaign Audit By UserId and CampaignId
   *
   * @param  {Number}  userId
   * @param  {Number}  personId
   * @param  {Number}  campaignId
   * @param  {Function} callback
   * @return {[Object]} Object with UserId, PersonId, CampaignId and Audit Obj
   */
  const getCampaignAudit = (userId, personId, campaignId, campaignAuditCB) => {
    Person.app.models.campaignAudit.getAuditByPersonAndCampaign(
        personId, campaignId, (auditErr, audit) => {
      if(auditErr || !audit) {
        const errorMsg = auditErr ? "Error getting audit" : "Audit not Found";
        const stack = auditErr ? auditErr.stack : null;
        logger.error(errorMsg,
          {error: auditErr, stack: stack, input: {
            campaignId: campaignId, personId: personId}});
        const errorMessage = errorMessages.SERVER_ERROR;
        return campaignAuditCB(errorMessage);
      }
      return campaignAuditCB(null, userId, personId, campaignId, audit);
    });
  };

  /**
   * Method to get Unsubscribe By UserId PersonId and CampaignId
   * 		If not available a new entry will be created
   *
   * @param  {Number}  userId
   * @param  {Number}  personId
   * @param  {Number}  campaignId
   * @param  {Object}  audit
   * @param  {Function} callback
   * @return {[Object]} Object with UserId, PersonId, CampaignId and Audit Obj
   */
  const getOrSaveUnsubscribe = (userId, personId, campaignId, audit,
        getOrSaveUnsubscribeCB) => {
    Person.app.models.unsubscribe.get(userId, personId, campaignId,
            (unsubErr, unsub) => {
      if(unsubErr) {
        logger.error("Error in getting subscription for user: ",
            userId, unsubErr);
        const errorMessage = errorMessages.SERVER_ERROR;
        return getOrSaveUnsubscribeCB(errorMessage);
      }
      if(unsub) {
        return getOrSaveUnsubscribeCB(null, unsub);
      }
      let unsubscribe = {
        personId: personId,
        userId: userId,
        campaignId: campaignId,
        campaignAuditId: audit.id
      };
      Person.app.models.unsubscribe.create(unsubscribe,
        (createErr, unsubscribeInst) => {
          if(createErr) {
            logger.error("Error while unsubscribe person : ", personId,
                  "for user", userId, createErr);
            const errorMessage = errorMessages.SERVER_ERROR;
            return getOrSaveUnsubscribeCB(errorMessage);
          }
          return getOrSaveUnsubscribeCB(null, unsubscribeInst);
        });
    });
  };

  /**
   * For: CSV - Upload and Add Recepient
   * Create a new person for the current list
   * @param  {[listid]} listid
   * @param  {[newPerson]} newPerson
   * @param  {[function]} createNewPersonCB
   * @return {[person]}
   * @author Aswin Raj A
   */
  Person.createNewPerson = (listid, newPerson, createNewPersonCB) => {
    Person.app.models.List.findById(listid, (listFindErr, list) => {
      if(listFindErr){
        logger.error("Error while finding list for listId:", {
           listid: listid,
           error: listFindErr,
           stack: listFindErr ? listFindErr.stack : ""
         });
        return createNewPersonCB(listFindErr);
      }
      list.people.create(newPerson, (personCreateErr, person) => {
        if(personCreateErr){
          logger.error("Error while creating person for list", {
            listid: listid,
            error: personCreateErr,
            stack: personCreateErr ? personCreateErr.stack : ""
          });
          return createNewPersonCB(personCreateErr);
        }
        return createNewPersonCB(null, person);
      });
    });
  };


  /**
   * For: CSV - Upload and Add Recepient
   * Create a new person for the current list createdBy the current user
   * @param  {[ctx]} ctx
   * @param  {[newPerson]} newPerson
   * @param  {[listId]} listId
   * @param  {[type]} createNewPersonForListCB
   * @return {[person]}
   * @author Aswin Raj A
   */
  Person.createNewPersonForList = (ctx, newPerson, listId,
    createNewPersonForListCB) => {
    Person.app.models.list.find({
      where: {id: listId, createdBy: ctx.req.accessToken.userId}
    }, (listFindErr, lists) => {
      if(listFindErr) {
        logger.error("Error while finding list for listid", {
          listId : listId,
          error: err,
          stack: err ? err.stack : ""
        });
        return createNewPersonForListCB(listFindErr);
      }
      lists[0].people.create(newPerson, (listCreateErr, person) => {
        if(listCreateErr){
          logger.error("Error while creating person for list", {
            listId : listId,
            error: err,
            stack: err ? err.stack : ""
          });
          return createNewPersonForListCB(listCreateErr);
        }
        return createNewPersonForListCB(null, person);
      });
    });
  };


  /**
   * For: CSV - Upload and Add Recepient
   * Method to associate a person to the current list
   * @param  {[list]} list
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} associateCB
   * @return {[oldPerson, newPerson]}
   * @author Aswin Raj A
   */
  Person.associatePersonWithList = (list, oldPerson, newPerson,
    associateCB) => {
    list.people.add(oldPerson.id, (peopleCreateErr, people) => {
      if(peopleCreateErr){
        logger.error("Error while creating people for list", {
          listid: listid,
          error: peopleCreateErr,
          stack: peopleCreateErr ? peopleCreateErr.stack : ""
        });
        associateCB(peopleCreateErr);
      }
      associateCB(null, oldPerson, newPerson);
    });
  };

  /**
   * For: CSV - Upload and Add Recepient
   * Generate audit person object if there are any changes to the current
   * person entry
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} generateAuditPersonObjCB
   * @return {[auditPersonObj, oldPerson, newPerson]}
   * @author Aswin Raj A
   */
  Person.generateAuditPersonObj = (oldPerson, newPerson,
    generateAuditPersonObjCB) => {
    let auditPersonObj = {};
    if(oldPerson.firstName !== newPerson.firstName){
      auditPersonObj.firstName = oldPerson.firstName;
    }
    if(oldPerson.middleName !== newPerson.middleName){
      auditPersonObj.middleName = oldPerson.middleName;
    }
    if(oldPerson.lastName !== newPerson.lastName){
      auditPersonObj.lastName = oldPerson.lastName;
    }
    let objLength = Object.getOwnPropertyNames(auditPersonObj).length;
    if(objLength!== emptycount){
      auditPersonObj.personId = oldPerson.id;
    }
    return generateAuditPersonObjCB(null, auditPersonObj, oldPerson, newPerson);
  };

  /**
   * For: CSV - Upload and Add Recepient
   * Save person to the audit table
   * @param  {[auditPersonObj]} auditPersonObj
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} savePersonAuditCB
   * @return {[oldPerson, newPerson]}
   * @author Aswin Raj A
   */
  Person.savePersonAudit = (auditPersonObj, oldPerson, newPerson,
    savePersonAuditCB) => {
    let personAuditLength = Object.getOwnPropertyNames(auditPersonObj).length;
    if(personAuditLength !== emptycount){
      Person.app.models.personAudit.create(auditPersonObj,
        (auditCreateErr, createdPerson) => {
        if(auditCreateErr){
          logger.error("Error while creating personAudit", {
            auditPerson: auditPersonObj,
            error: auditCreateErr,
            stack: auditCreateErr ? auditCreateErr.stack : ""
          });
          savePersonAuditCB(auditCreateErr);
        }
        savePersonAuditCB(null, oldPerson, newPerson);
      });
    } else{
      savePersonAuditCB(null, oldPerson, newPerson);
    }
  };

  /**
   * For: CSV - Upload and Add Recepient
   * Update the existing person with the new data
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} updateDataCB
   * @return {[updatedObj]}
   * @author Aswin Raj A
   */
  Person.updatePersonWithNewData = (oldPerson, newPerson, updateDataCB) => {
    oldPerson.updateAttributes(newPerson, (updateErr, updatedObj) => {
      if(updateErr) {
        logger.error("Error while updating person", {
          person: oldPerson,
          error: oldPerson,
          stack: oldPerson ? oldPerson.stack : ""
        });
        updateDataCB(updateErr);
      }
      updateDataCB(null, updatedObj);
    });
  };

  // Person.observe("after save", function(ctx, next) {
  //   let person = ctx.instance;
  //   let personAddtionalData = [];
  //   let additionalFieldLen = 5;
  //   for (let i = 1; i <= additionalFieldLen; i++) {
  //     let field = "field" + i;
  //     let value = "value" + i;
  //     if (person[field] && person[value]) {
  //       personAddtionalData.push({
  //         name: person[field],
  //         value: person[value]
  //       });
  //     }
  //   }
  //   //Updating the addtional fields is difficult and so delete & recreate it
  //   person.fields.destroyAll((err, data) => {
  //     if (err) next(err);
  //     person.fields.create(personAddtionalData, (err, persons) => {
  //       if (err) next(err);
  //       next();
  //     });
  //   });
  // });


};
