"use strict";

import logger from "../../server/log";
import lodash from "lodash";
import async from "async";
import _ from "underscore";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import constants from "../../server/utils/constants";
import validator from "../../server/utils/validatorUtility";

module.exports = function(List) {
  /**
   * Itterates the list and send list object for generating emails for
   * corresponding person
   *
   * @param  {[campaign]} campaignObject
   * @param  {[followup]} followupObject
   * @param  {[function]} getPoepleAndGenerateEmailCB [callback]
   * @return {[void]}
   * @author Ramanavel Selvaraju
   */
  List.getListAndSaveEmail = (campaign, followup, getListAndSaveEmailCB) => {
    List.app.models.campaign.findById(campaign.id,
      (campaignFindErr, campaign) => {
      if(campaignFindErr){
        logger.error("Error while finding campaign", {
          input:{campaignId: campaign.id}, error: campaignFindErr,
          stack: campaignFindErr.stack});
        return getListAndSaveEmailCB(campaignFindErr);
      }
      campaign.lists((listErr, lists) => {
        if(listErr) {
          logger.error("Error on getting the lists for a  campaign", {
            campaign: campaign, followup:followup,
            error: listErr, stack: listErr.stack
          });
          return getListAndSaveEmailCB(listErr);
        }
        const listIds = _.pluck(lists, "id");
        async.eachSeries(lists, (list, listsCB) => {
          List.app.models.person.getPoepleAndGenerateEmail(campaign, list,
            listIds, followup, (getPoepleByListForEmailErr) => {
              if(getPoepleByListForEmailErr) {
                if(getPoepleByListForEmailErr.name === "StatusMismatchError") {
                    return getListAndSaveEmailCB(getPoepleByListForEmailErr);
                }
              }
              return listsCB(getPoepleByListForEmailErr);
            });
        }, (asyncEachErr) => {
          return getListAndSaveEmailCB(asyncEachErr);
        });
      });
    });
  };

  List.remoteMethod(
    "fieldsWithMeta",
    {
      description: "List all the people and its field data for given list id's",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "id", type: "any", required: true,
          http: {source: "path"}
        },
      ],
      returns: {arg: "additionalField", type: "additionalField", root: true},
      http: {verb: "get", path: "/:id/fieldswithmeta"}
    }
  );

  /**
   * List fields with the meta fields will be returned for given list id
   * @param  {[Context]} ctx [context object to get access token]
   * @param  {[number]}  id  [List id]
   * @param  {Function}  cb  [To return the value to API]
   * @return {[void]}
   * @author Ramanavel Selvaraju
   */
  List.fieldsWithMeta = (ctx, id, fieldsWithMetaCB) => {
    let listFieldsWithMeta = {};
    //getting alll the list fields values
    List.find({
      where: {id: id, createdBy: ctx.req.accessToken.userId},
      include: "fields"
    }, (ListErr, lists) => {
      if(ListErr) {
        logger.error("Error in getting fields for the list", id);
        return fieldsWithMetaCB(ListErr);
      }
      if(lodash.isEmpty(lists)) {
        logger.error("List Not Found for the id : ", id);
        let ListNotFoundErr = {
            "name": "Error",
            "status": 404,
            "message": "Unknown List id "+id,
            "statusCode": 404
        };
        return fieldsWithMetaCB(ListNotFoundErr);
      }
      let list = JSON.parse(JSON.stringify(lists[0]));
      listFieldsWithMeta.listFields = list.fields;
      // getting meta data
      List.app.models.additionalField.find({where: {isApproved: true}},
          (metaFieldsErr, fields) => {
            if(metaFieldsErr) return fieldsWithMetaCB(metaFieldsErr);
            let restFields = lodash.differenceBy(fields, list.fields, "id");
            listFieldsWithMeta.metaFields = restFields;
            return fieldsWithMetaCB(null, listFieldsWithMeta);
          }
      );
    });
  };

  List.remoteMethod(
    "peopleWithFields",
    {
      description: "List all the people and its field data for given list id's",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "list", type: "Object", required: true,
          http: {source: "body"}
        },
      ],
      returns: {arg: "additionalField", type: "additionalField", root: true},
      http: {verb: "post", path: "/peopleWithFields"}
    }
  );
  /**
   * Gets addtional fields and people with addtional field values
   * for given list ids
   * @param  {[Context]}      ctx   [context object to get access token]
   * @param  {[number Array]} list  [list of list ids]
   * @param  {[function]}     peopleWithFieldsCB
   * @return {[Object]} {List[field], List[Person[FieldValue[Field]]]}
   * @author Ramanavel Selvaraju
   */
  List.peopleWithFields = (ctx, list, peopleWithFieldsCB) => {
    let userId = ctx.req.accessToken.userId;
    async.autoInject({
      fields: [async.apply(getFieldsForList, userId, list)],
      unsubscribedPersons: [async.apply(getUnsubscribedPersons, userId)],
      peopleWithFields: (fields, unsubscribedPersons, callback) => {
        let listWithFieldsForIds = fields[0];
        let lists = fields[1];
        generatePeopleWithFields(listWithFieldsForIds, lists,
            unsubscribedPersons, (error, peopleWithField) => {
          callback(error, peopleWithField);
        });
      }
    }, (asyncErr, result) => {
      if(asyncErr){
        peopleWithFieldsCB(asyncErr);
      }
      peopleWithFieldsCB(null, result.peopleWithFields);
    });
  };

  /**
   * Step 1/ peopleWithFields
   * To get all the fields for the current list created by the current user
   * @param  {[ctx]} ctx
   * @param  {[list]} list
   * @param  {[function]} getFieldsForListCB
   * @return {[listWithFields, lists]}
   * @author Aswin Raj A
   */
  const getFieldsForList = (userId, list, getFieldsForListCB) => {
    let listWithFieldsForIds = [];
    if(lodash.isEmpty(list.ids)){
      return getFieldsForListCB("No Lists selected");
    }
    List.find({
       where: {id: {inq: list.ids}, createdBy: userId}
     }, (ListErr, lists) => {
       if(ListErr || lodash.isEmpty(lists)) {
         const errParam = ListErr || new Error("No list for list id");
         logger.error(errParam.msg, {
           input: {listId : list.ids},
           stack: ListErr ? ListErr.stack : ""
         });
         return getFieldsForListCB(ListErr);
       }
       async.eachSeries(lists, (list, listCB) => {
        list.fields((fieldsFindErr, fields) => {
          if(fieldsFindErr){
           logger.error("Error while finding list", {
             input: {listId: list.id},
             error: fieldsFindErr, stack: fieldsFindErr.stack});
           return getFieldsForListCB(fieldsFindErr);
          }
          let listWithFields = JSON.parse(JSON.stringify(list));
          listWithFields.fields = fields;
          listWithFieldsForIds.push(listWithFields);
          return listCB(null);
         });
       }, (asyncEachErr) => {
         return getFieldsForListCB(asyncEachErr, listWithFieldsForIds, lists);
       });
     });
  };

  /**
   * Step 2/ peopleWithFields
   * Iterate through all the list and generate people with fields for each list
   * @param  {[listWithFieldsForIds]} listWithFieldsForIds
   * @param  {[lists]} lists
   * @param  {[function]} generateCB
   * @return {[peopleWithFieldsForIds]}
   * @author Aswin Raj A, Syed Sulaiman M(Modified)
   */
  const generatePeopleWithFields = (listWithFieldsForIds, lists,
      unsubscribedPersons, generateCB) => {
    let peopleWithFieldsForIds = [];
      async.eachSeries(listWithFieldsForIds, (listWithFields, listCB) => {
      List.findById(listWithFields.id, (listFindErr, list) => {
        if(listFindErr) {
          logger.error("Error while finding list", {input: {listId: list.id},
          error: listFindErr, stack: listFindErr.stack});
          generateCB(listFindErr);
        }
        getPeopleForList(list, (listErr, people, list) => {
          if(listErr) return listCB(listErr);
          getFieldsForPeople(people, list, unsubscribedPersons,
              (peopleErr, peopleObj) => {
            if(peopleErr) return listCB(peopleErr);
            listWithFields = JSON.parse(JSON.stringify(listWithFields));
            listWithFields.people = peopleObj;
            peopleWithFieldsForIds.push(listWithFields);
            return listCB(null);
          });
        });
      });
    }, (asyncErr) => {
      return generateCB(asyncErr, peopleWithFieldsForIds);
    });
  };


/**
 * Step 1/ generatePeopleWithFields
 * To get all the people for the current list
 * @param  {[list]} list
 * @param  {[function]} getPeopleForListCB
 * @return {[people, list]}
 * @author Aswin Raj A
 */
  const getPeopleForList = (list, getPeopleForListCB) => {
    list.people((peopleFindErr, people) => {
      if(peopleFindErr){
        logger.error("Error while finding people for list", {
          input: {listId: list.id},
          error: peopleFindErr,
          stack: peopleFindErr ? peopleFindErr.stack: ""});
        return getPeopleForListCB(peopleFindErr);
      }
      return getPeopleForListCB(null, people, list);
    });
  };

  /**
   * Step 2/ generatePeopleWithFields
   * To get all the fields for each person associated with the current list
   * @param  {[people]} people
   * @param  {[list]} list
   * @param  {[function]} getFieldsForPeopleCB
   * @return {[peopleObj]}
   * @author Aswin Raj A
   */
  const getFieldsForPeople = (people, list, unsubscribedPersons,
      getFieldsForPeopleCB) => {
    const listId = list.id;
    let peopleObj = [];
    async.eachSeries(people, (person, personCB) => {
      let isUnsubscribed =
        lodash.find(unsubscribedPersons, {"personId": person.id});
      List.app.models.additionalFieldValue.find({
        where: {and: [{personId: person.id}, {listId: listId}]}
      }, (fieldsFindErr, fields) => {
        if(fieldsFindErr){
          logger.error("Error while finding list", {
            input: {personId: person.id, listId: listId},
            error: fieldsFindErr, stack: fieldsFindErr.stack
          });
          personCB(fieldsFindErr);
        }
        person = JSON.parse(JSON.stringify(person));
        person.isUnsubscribed = isUnsubscribed ? true : false;
        person.fieldValues = fields;
        peopleObj.push(person);
        personCB(null);
      });
    }, (asyncErr) => {
      if(asyncErr){
        getFieldsForPeopleCB(asyncErr);
      }
      getFieldsForPeopleCB(null, peopleObj);
    });
  };

  /**
   * Method to get Unsubscribed Persons by UserId
   * @param  {Number}   userId   [description]
   * @param  {Function} callback [description]
   * @return {[Unsubscribe]} List of Unsubscribe
   * @author Syed Sulaiman M
   */
  const getUnsubscribedPersons = (userId, callback) => {
    let userIds = [userId];
    List.app.models.unsubscribe.getByUserIds(userIds,
        (unsubscribeErr, unsubscribes) => {
      if(unsubscribeErr){
        logger.error("Error while finding Unsubscribed Persons", {
          error: unsubscribeErr, stack: unsubscribeErr.stack,
          input: {userIds: userIds}
        });
        return callback(unsubscribeErr);
      }
      return callback(null, unsubscribes);
    });
  };

  List.remoteMethod(
    "createMultiplePersonWithFields",
    {
      description: "Saves multiple person object with additional fields",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "id", type: "number", required: true,
          http: {source: "path"}
        },
        {
          arg: "reqParams", type: "object", required: true,
          http: {source: "body"}
        }
      ],
      returns: {arg: "person", type: "person", root: true},
      //returns: {arg: "personList",type: "array",root: true},
      http: {verb: "post", path: "/:id/createMultiplePersonWithFields"}
    }
  );

  /**
   * Saves person array of object with related field values and associates with
   *  list
   * Exmaple of a reqParam
   * {"personList": [{"firstName": "Test FN",
   *    "middleName": "Test MN",
   *    "lastName": "Test LN",
   *    "email": "test@ideas2it.com"
   *  }, {
   *    "firstName": "Test2",
   *    "middleName": "2",
   *    "lastName": "4",
   *    "email": "Test2@ideas2it.com"
   *  }],
   *}
   *
   * @param  {[Context]} ctx [Context Object to get accessToken]
   * @param  {[number]} id [listId]
   * @param  {[Object]} reqParam [Exmaple of an reqParam shown above]
   * @param  {[function]} createMultiplePersonWithFieldsCB [description]
   * @return {[person]} [Persisted List of person with fields and values]
   * @author Anand N G(Modified)
   */
  List.createMultiplePersonWithFields = (ctx, id, reqParams,
    createMultiplePersonWithFieldsCB) => {
    logger.info("----createMultiplePersonWithFields-----------");
    async.waterfall([
      /* @todo - Validate and insert
       * duplicate emails are inserting in bulk upload - check it
       */
      async.apply(createMultiplePerson, ctx, reqParams, id)
    ], (asyncErr, savedMultiplePersonList) => {
      if(asyncErr){
        logger.error(asyncErr);
        createMultiplePersonWithFieldsCB(asyncErr);
      }
      createMultiplePersonWithFieldsCB(null, savedMultiplePersonList);
    });
  };

  /**
   * Create multiple person list
   * @param  {[ctx]} ctx
   * @param  {[reqParams]} reqParams
   * @param  {[listId]} listId
   * @param  {[function]} createMultiplePersonCB
   * @return {[person]} [Persisted person with fields and values]
   * @author Anand N G
   */
  let createMultiplePerson = (ctx, reqParams, listId,
    createMultiplePersonCB) => {
    logger.info("---createMultiplePerson-----");
    List.app.models.person.createNewPersonForList(ctx, reqParams.personList,
      listId, (createErr, personList) => {
      if(createErr) {
        logger.error(createErr);
        createMultiplePersonCB(createErr);
      }
      logger.info("personList--------------final", personList);
      let res = {listId : listId, personList: personList};
      createMultiplePersonCB(null, res);
    });
  };

  List.remoteMethod(
    "savePersonWithFields",
    {
      description: "Saves person object with additional fields",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "id", type: "number", required: true,
          http: {source: "path"}
        },
        {
          arg: "reqParams", type: "object", required: true,
          http: {source: "body"}
        }
      ],
      returns: {arg: "person", type: "person", root: true},
      http: {verb: "post", path: "/:id/savePersonWithFields"}
    }
  );

  /**
   * Saves person object with related field values and associates with list
   * Exmaple of a reqParam
   *{
   *"person":{
   *    "firstName": "Test FN",
   *    "middleName": "Test MN",
   *    "lastName": "Test LN",
   *    "email": "test@ideas2it.com"
   *  },
   *"fieldValues":  [{
   *    "value": "test1",
   *    "fieldId": 1
   *    },{
   *    "value": "test2",
   *    "fieldId": 2
   *  }]
   *}
   *
   * @param  {[Context]} ctx [Context Object to get accessToken]
   * @param  {[number]} id [listId]
   * @param  {[Object]} reqParam [Exmaple of an reqParam shown above]
   * @param  {[function]} savePersonWithFieldsCB [description]
   * @return {[person]} [Persisted person with fields and values]
   * @author Ramanavel Selvaraju, Aswin Raj A(Modified), Naveen Kumar(Modified)
   */
  List.savePersonWithFields = (ctx, id, reqParams, savePersonWithFieldsCB) => {
    async.waterfall([
      async.apply(validateNames, ctx, reqParams, id),
      createOrUpdatePerson,
      createOrUpdateFields,
      getSavedPersonWithFields
    ], (asyncErr, savedPersonWithFields) => {
      if(asyncErr){
        logger.error(asyncErr);
        savePersonWithFieldsCB(asyncErr);
      }
      savePersonWithFieldsCB(null, savedPersonWithFields);
    });
  };

  /**
   * Validates the following condition
   * Do the field names not start with a nuber, do the field names not have
   * special characters
   * @param  {[ctx]} ctx
   * @param  {[reqParams]} reqParams
   * @param  {[listId]} listId
   * @param  {[function]} createOrUpdatePersonCB
   * @return {[ctx, reqParams, listId]}
   * @author Naveen Kumar
   */
  const validateNames = (ctx, reqParams, id, validateNamesCB) => {
    let isValidFlag = true;
    const currentPerson = reqParams.person;
    if(currentPerson.firstName) {
      isValidFlag = currentPerson.firstName.trim().length ? isValidFlag : false;
      isValidFlag = validator.validateFieldName(currentPerson.firstName)
        ? isValidFlag : false;
    } else {
      isValidFlag = false;
    }
    if(currentPerson.middleName) {
      isValidFlag = validator.validateFieldName(currentPerson.middleName)
        ? isValidFlag : false;
    }
    if(currentPerson.lastName) {
      isValidFlag = validator.validateFieldName(currentPerson.lastName)
        ? isValidFlag : false;
    }
    if(currentPerson.email) {
      validator.validateEmail(currentPerson.email, (isValid) => {
        isValidFlag = isValid;
      });
    }
    currentPerson.firstName = currentPerson.firstName ?
      lodash.capitalize(currentPerson.firstName) : null;
    currentPerson.middleName = currentPerson.middleName ?
      lodash.capitalize(currentPerson.middleName) : null;
    currentPerson.lastName = currentPerson.lastName ?
      lodash.capitalize(currentPerson.lastName) : null;
    if(!isValidFlag) {
      logger.error("Invalid Data", {
        input: reqParams.person
      });
      const errorMessage = errorMessages.INVALID_DATA;
      return validateNamesCB(errorMessage);
    }
    return validateNamesCB(null, ctx, reqParams, id);
  };

  /**
   * Create or Update the Person for the current list,
   * Check if there already exist a person entry with the same email id
   * If exist, and if exist in the same list then update Person For CurrentList
   * else update person for the different list
   * Else create a new entry for person and additionalFields
   * @param  {[ctx]} ctx
   * @param  {[reqParams]} reqParams
   * @param  {[listId]} listId
   * @param  {[function]} createOrUpdatePersonCB
   * @return {[personId, listId, newAdditionalFields]}
   * @author Aswin Raj A
   */
  let createOrUpdatePerson = (ctx, reqParams, listId,
    createOrUpdatePersonCB) => {
    const newPerson = _.omit(reqParams.person, "fieldValues");
    const newAdditionalFields = reqParams.person.fieldValues;
    List.app.models.person.find({
      where : {
        email : newPerson.email,
      }
    }, (personFindErr, people) => {
      if(personFindErr) {
        logger.error("Error while finding person for the email id", {
          input : {email : newPerson.email},
          error: personFindErr,
          stack: personFindErr.stack
        });
        createOrUpdatePersonCB(personFindErr);
      }
      if(lodash.isEmpty(people)){
        List.app.models.person.createNewPersonForList(ctx, newPerson, listId,
          (createErr, person) => {
          if(createErr){
            logger.error(createErr);
            createOrUpdatePersonCB(createErr);
          }
          createOrUpdatePersonCB(null, person.id, listId, newAdditionalFields,
            person);
        });
      } else {
        updatePersonForDifferentList(listId, people[0], newPerson,
          (updateErr, updatedPerson) => {
          if(updateErr){
            logger.error(updateErr);
            return createOrUpdatePersonCB(updateErr);
          }
          return createOrUpdatePersonCB(null, updatedPerson.id, listId,
            newAdditionalFields, updatedPerson);
        });
      }
    });
  };

  /**
   * If there exist an email in different list, then update the person for
   * another list,
   * Associate the person to the new list
   * Update the person if necessary and make an entry in audit table
   * @param  {[listid]} listid
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} updatePersonCB
   * @return {[type]}
   * @author Aswin Raj A
   */
  let updatePersonForDifferentList = (listid, oldPerson, newPerson,
    updatePersonCB) => {
    List.findById(listid, (listFindErr, list) => {
      if(listFindErr){
        logger.error("Error while finding list", {
          listid: listid,
          error: listFindErr,
          stack: listFindErr.stack
        });
        updatePersonCB(listFindErr);
      }
      async.waterfall([
        async.apply(List.app.models.person.associatePersonWithList, list,
          oldPerson, newPerson),
        List.app.models.person.generateAuditPersonObj,
        List.app.models.person.savePersonAudit,
        List.app.models.person.updatePersonWithNewData
      ], (asyncErr, person) => {
        if(asyncErr){
          logger.error("Error while updating person who exist in another list",
            asyncErr);
          return updatePersonCB(asyncErr);
        }
        return updatePersonCB(null, person);
      });
    });
  };

  /**
   * Create or Update additionalField values
   * - If additional field value already exist for the person in the current list
   *   update it
   * - Else create a new entry
   * @param  {[personId]} personId
   * @param  {[listid]} listid
   * @param  {[newAdditionalFields]} newAdditionalFields
   * @param  {[function]} createOrUpdateFieldsCB
   * @author Aswin Raj A
   */
  let createOrUpdateFields = (personId, listid, newAdditionalFields, newPerson,
    createOrUpdateFieldsCB) => {
    let newFieldValues = [];
    newAdditionalFields = newAdditionalFields.map(field => {
      field.personId = personId;
      return field;
    });
    async.eachSeries(newAdditionalFields, (newField, fieldCB) => {
      List.app.models.additionalFieldValue.find({
        where:{
          and:[
            {fieldId : newField.fieldId},
            {listId : newField.listId},
            {personId : newField.personId}
          ]
        }
      }, (fieldFindErr, fields) => {
        if(fieldFindErr){
          logger.error("Error while finding list", {
            fieldId : newField.fieldId,
            listId : newField.listid,
            personId : newField.personId,
            error: fieldFindErr,
            stack: fieldFindErr.stack
          });
          return fieldCB(fieldFindErr);
        }
        if(lodash.isEmpty(fields)){
          if(newField.value !== ""){
            List.app.models.additionalFieldValue.createFields(newField,
              (fieldCreateErr, field) => {
              if(fieldCreateErr){
                logger.error("Error while creating additionalFieldValue", {
                  field: field,
                  error: fieldCreateErr,
                  stack: fieldCreateErr.stack
                });
                return fieldCB(fieldCreateErr);
              }
              newFieldValues.push(field);
              return fieldCB(null);
            });
          } else{
            return fieldCB(null);
          }
        } else{
          if(newField.value !== ""){
            List.app.models.additionalFieldValue.updateFields(fields[0],
              newField, (fieldUpdateErr, updatedField) => {
              if(fieldUpdateErr){
                logger.error("Error while updating additionalFieldValue", {
                  error: fieldUpdateErr,
                  stack: fieldUpdateErr.stack
                });
                return fieldCB(fieldUpdateErr);
              }
              newFieldValues.push(updatedField);
              return fieldCB(null);
            });
          } else{
            newFieldValues.push(fields[0]);
            return fieldCB(null);
          }
        }
      });
    }, (err) => {
      if(err){
        logger.error("Error while creating additional field for person", {
          personId: personId,
          error: err,
          stack: err ? err.stack : ""
        });
        return createOrUpdateFieldsCB(err);
      }
      return createOrUpdateFieldsCB(null, newPerson, newFieldValues);
    });
  };

  const getSavedPersonWithFields = (newPerson, newFieldValues, getPersonCB) => {
    newPerson = JSON.parse(JSON.stringify(newPerson));
    newPerson.fieldValues = newFieldValues;
    getPersonCB(null, newPerson);
  };

  List.remoteMethod(
    "updatePersonWithFields", {
      description: "Update person object with additional fields",
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
        arg: "personId",
        type: "number",
        required: true,
        http: {
          source: "path"
        }
      }, {
        arg: "reqParams",
        type: "object",
        required: true,
        http: {
          source: "body"
        }
      }],
      returns: {
        arg: "person",
        type: "person",
        root: true
      },
      http: {
        verb: "put",
        path: "/:id/person/:personId/updatePersonWithFields"
      }
    }
  );

  /**
   * @param  {[Context]} ctx [Context Object to get accessToken]
   * @param  {[number]} id [listId]
   * @param  {[Object]} reqParam [Exmaple of an reqParam shown above]
   * @param  {[function]} savePersonWithFieldsCB [description]
   * @return {[List]} [List with Person, Fields and values]
   * @author Syed Sulaiman M, Aswin Raj(Modified)
   */
  List.updatePersonWithFields = (ctx, id, personId, reqParams, callback) => {
    const userId = ctx.req.accessToken.userId;
    const listId = id;
    async.waterfall([
      async.apply(updatePersonAndFieldValues, userId, listId, personId,
        reqParams),
      constructResponse
    ], (error, result) => {
      if (error) {
        logger.error("Error while updating Person", error);
        return callback(error);
      }
      return callback(null, result);
    });
  };

  /**
   * Updates a Person and Associated Field Values
   * @param  {[Object]}   params Contains Details of Person, Fields to be
   * updated
   * @param  {Function} callback
   * @author Syed Sulaiman M, Aswin Raj A(Modified)
   */
  const updatePersonAndFieldValues = (userId, listId, personId, reqParams,
    callback) => {
    List.find({
      where: {
        id: listId,
        createdBy: userId
      }
    }, (listsErr, lists) => {
      if (listsErr) {
        logger.error("Error in getting List for id : ", listId);
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if (lodash.isEmpty(lists)) {
        logger.error("Error in getting List for id : ", params.listId);
        const errorMessage = errorMessages.LIST_NOT_FOUND;
        return callback(errorMessage);
      }
      async.waterfall([
        async.apply(updatePerson, lists[0], reqParams),
        updateFieldValues
      ], (error, list, person) => {
        return callback(error, list, person);
      });
    });
  };

  /**
   * Updates a Person
   * @param  {[Object]}   list
   * @param  {[Object]}   params Contains Details of Person, Fields to be updated
   * @param  {Function} callback
   * @author Syed Sulaiman M, Aswin Raj A(Modified)
   */
  const updatePerson = (list, reqParams, callback) => {
    let newPerson = reqParams.person;
    list.people.findById(newPerson.id, (personErr, oldPerson) => {
      if (personErr) {
        logger.error("Error while finding person", {
          input: {personId: newPerson.id},
          error: personErr, stack: personErr.stack});
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if (newPerson.email === oldPerson.email) {
        updatePersonForDifferentList(list.id, oldPerson, newPerson,
          (error, person) => {
            return callback(error, list, person, newPerson.fieldValues);
        });
      } else {
        newPerson.fieldValues = newPerson.fieldValues.map(fieldValue => {
          return _.omit(fieldValue, "id");
        });
        List.app.models.person.find({
          where: {
            email : newPerson.email
          }
        }, (findErr, people) => {
          if(findErr){
            logger.error("Error while finding person", {
              input: {email : newPerson.email}, error: findErr,
              stack: findErr.stack
            });
            callback(findErr);
          }
          newPerson = _.omit(newPerson, "id");
          if(lodash.isEmpty(people)) {
            list.people.remove(oldPerson, (removeErr) => {
              if(removeErr) {
                logger.error("Error while removing person from list", {
                  input: {person: oldPerson, list: list.id},
                  error: removeErr, stack: removeErr.stack});
                return callback(removeErr);
              }
              List.app.models.person.createNewPerson(list.id, newPerson,
                (createErr, person) => {
                return callback(createErr, list, person, newPerson.fieldValues);
              });
            });
          } else {
            people[0].lists((listFindErr, lists) => {
              if(listFindErr) {
                logger.error("Error while finding the lists for person", {
                  input: {personId: people[0].id},
                  error: listFindErr, stack: listFindErr.stack});
                return callback(listFindErr);
              }
              const personsListIds = _.pluck(lists, "id");
              if(personsListIds.indexOf(list.id) > constants.EMPTYARRAYINDEX){
                logger.error("Person already exists in the current list", {
                  input:{personId: people[0].id, listId: list.id}});
                const errorMessage = errorMessages.PERSON_EXISTS_IN_LIST;
                return callback(errorMessage);
              }
              list.people.remove(oldPerson, (removeErr) => {
                if(removeErr) {
                  logger.error("Error while removing person from list", {
                    input: {person: oldPerson, list: list.id},
                    error: removeErr, stack: removeErr.stack});
                  return callback(removeErr);
                }
                updatePersonForDifferentList(list.id, people[0], newPerson,
                  (personUpdateErr, person) => {
                  return callback(personUpdateErr, list, person,
                    newPerson.fieldValues);
                });
              });
            });
          }
        });
      }
    });
  };

  /**
   * Updates Field Values
   * @param  {[Object]}   list
   * @param  {[Object]}   person
   * @param  {[Object]}   params Contains Details of Person, Fields to be
   * updated
   * @param  {Function} callback
   * @author Syed Sulaiman M, Aswin Raj A(Modified)
   */
  const updateFieldValues = (list, person, fieldValues, callback) => {
    let fieldIds = [];
    async.each(fieldValues, (fieldValue, fieldValueCB) => {
      if (!lodash.has(fieldValue, "id")) {
        List.app.models.additionalFieldValue.find({
          where: {
            listId: fieldValue.listId,
            personId: person.id,
            fieldId: fieldValue.fieldId
          }
        }, (fieldErr, field) => {
          if (!lodash.isEmpty(field)) {
            const errorMessage = errorMessages.FIELD_VALUE_CONFLICT;
            logger.error("Field Already Exists for User", errorMessage);
            return callback(errorMessage);
          }
          fieldValue.personId = person.id;
          List.app.models.additionalFieldValue.create(fieldValue,
              (createdFieldErr, createdField) => {
            fieldIds.push(createdField.id);
            return fieldValueCB(createdFieldErr, createdField);
          });
        });
      } else {
        List.app.models.additionalFieldValue.findById(fieldValue.id,
            (addFieldValueErr, addFieldValue) => {
          if (addFieldValueErr) {
            callback(addFieldValueErr);
          } else {
            if (lodash.isEmpty(addFieldValue)) {
              logger.error("Error in gettig Field Values");
              const errorMessage = errorMessages.FIELD_VALUES_NOT_FOUND;
              return callback(errorMessage);
            }
            addFieldValue.updateAttribute("value", fieldValue.value,
                  (updatedFieldErr, updatedField) => {
              fieldIds.push(updatedField.id);
              return fieldValueCB(updatedFieldErr, updatedField);
            });
          }
        });
      }
    }, (asyncErr) => {
      if (asyncErr) {
        logger.error("Error in updating additional Field : ", asyncErr);
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      List.app.models.additionalFieldValue.deleteNotInFields(
        person.id, list.id, fieldIds, (deleteErr, result) => {
        return callback(null, list, person);
      });
    });
  };


  /**
   * Method to construct Response for Update Person with Field Values
   * @param  {[Object]}  list   List object whose Person to be updated
   * @param  {[Object]}  person Person object
   * @param  {Function} callback
   * @return {[Object]} Object Conatins List with Person and Field Values
   * @author Syed Sulaiman M, Aswin Raj A(Modified)
   */
  const constructResponse = (list, person, callback) => {
    let personRes = JSON.parse(JSON.stringify(person));
    List.app.models.additionalFieldValue.find({
      where: {
        personId: person.id,
        listId: list.id,
      }
    }, (fieldValuesErr, fieldValues) => {
      if(fieldValuesErr) {
        return callback(fieldValuesErr);
      }
      personRes.fieldValues = JSON.parse(JSON.stringify(fieldValues));
      return callback(null, personRes);
    });
  };

  List.remoteMethod(
    "listMetrics", {
      description: "Get List Metrics",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }],
      returns: {
        arg: "list",
        type: "array",
        root: true
      },
      http: {
        verb: "get",
        path: "/listMetrics"
      }
    }
  );
  /**
   * Method to return list metrics
   * @return {[Object]} List and its metric
   * @todo change listResponse.additions to dynamic value
   */
  List.listMetrics = (ctx, callback) => {
    List.find({
      where: {createdBy: ctx.req.accessToken.userId},
      order: "createdAt DESC"
    }, (listsErr, lists) => {
      let listResponses = [];
      async.eachSeries(lists, (list, listsCB) => {
        let listResponse = {};
        listResponse.id = list.id;
        listResponse.name = list.name;
        listResponse.createdAt = list.createdAt;
        listResponse.additions = 0;

        async.parallel([
          (callback) => {
            list.user((error, user) => {
              let names = [user.firstName, user.lastName];
              listResponse.createdBy = lodash.join(names, " ").trim();
              callback(null, listResponse);
            });
          },
          (callback) => {
            list.people((error, people) => {
              listResponse.membersCount = people.length;
              callback(null, listResponse);
            });
          },
          (callback) => {
            list.listMetrics((error, listMetrics) => {
              if (!lodash.isEmpty(listMetrics)) {
                const sentEmails = lodash.sumBy(listMetrics, "sentEmails");
                const bounced = lodash.sumBy(listMetrics, "bounced");
                const opened = lodash.sumBy(listMetrics, "opened");
                const clicked = lodash.sumBy(listMetrics, "clicked");
                const spammed = lodash.sumBy(listMetrics, "spammed");
                const hundred = 100;
                const totalEmailReached = sentEmails - bounced;
                listResponse.openPercentage =
                  lodash.round((opened / totalEmailReached) * hundred);
                listResponse.clickPercentage =
                  lodash.round((clicked / totalEmailReached) * hundred);
                listResponse.spamPercentage =
                  lodash.round((spammed / totalEmailReached) * hundred);
              } else {
                listResponse.openPercentage = null;
                listResponse.clickPercentage = null;
                listResponse.spamPercentage = null;
              }
              callback(null, listResponse);
            });
          },
          (callback) => {
            list.campaigns((campaignErr, campaigns) => {
              if (!lodash.isEmpty(campaigns)) {
                campaigns = lodash.filter(campaigns, (o) => {
                  return (o.lastRunAt !== null);
                });
                if (!lodash.isEmpty(campaigns)) {
                  campaigns = lodash.sortBy(campaigns, "lastRunAt");
                  let sizeToDec = 1;
                  let campaign = campaigns[campaigns.length - sizeToDec];
                  listResponse.lastRunAt = campaign.lastRunAt;
                } else {
                  listResponse.lastRunAt = null;
                }
              } else {
                listResponse.lastRunAt = null;
              }
              callback(null, listResponse);
            });
          }
        ], (error, response) => {
          listResponses.push(listResponse);
          listsCB(null, listResponse);
        });
      }, function(error, response) {
        callback(null, listResponses);
      });
    });
  };

  List.remoteMethod(
    "removePeople", {
      description: "Removes people from given list id",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "listId", type: "number", required: true, http: {source: "path"}},
        {arg: "peopleIds", type: "array", required: true,
            http: {source: "body"}}
      ],
      returns: {arg: "status", type: "string", root: true},
      http: {verb: "post", path: "/removePeople/:listId"}
    }
  );
  /**
   * Gets addtional fields and people with addtional field values
   * for given list ids
   * @param  {[Context]}      ctx   [context object to get access token]
   * @param  {[number Array]} list  [list of list ids]
   * @param  {[function]}     peopleWithFieldsCB
   * @return {[Object]} {List[field], List[Person[FieldValue[Field]]]}
   * @author Ramanavel Selvaraju
   */
  List.removePeople = (ctx, listId, peopleIds, callback) => {
    List.findById(listId, (listErr, list) => {
      if (lodash.isEmpty(list)) {
        const errorMessage = errorMessages.LIST_NOT_FOUND;
        return callback(errorMessage);
      }
      async.each(peopleIds, (peopleId, peopleCB) => {
        list.people.findById(peopleId, (personErr, person) => {
          if (!personErr) {
            List.app.models.additionalFieldValue.deleteFields(
                person.id, listId, (deleteErr, result) => {
              if (!deleteErr) {
                list.people.remove(person, (destroyPplErr) => {
                  peopleCB(destroyPplErr);
                });
              } else {
                peopleCB(deleteErr);
              }
            });
          } else {
            peopleCB(personErr);
          }
        });
      }, (err) => {
        if (err) {
          logger.error("Error while removing People from list, ", err);
          const notFound = 404;
          if (err.statusCode === notFound) {
            const errorMessage = errorMessages.PERSON_NOT_FOUND;
            return callback(errorMessage);
          }
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        return callback(null, "People Removed from List");
      });
    });
  };

  List.remoteMethod(
    "createField",
    {
      description: "To Create Field for List",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number", required: true, http: {source: "path"}},
        {arg: "additionalField", type: "additionalField",
            required: true, http: {source: "body"}}
      ],
      returns: {arg: "additionalField", type: "additionalField", root: true},
      http: {verb: "post", path: "/:id/createField"}
    }
  );
  /**
   * Method to create Additional field for a List
   * @param  {Context} ctx
   * @param  {Number} id  listId
   * @param  {Function}     callback
   * @return {AdditionalField}
   * @author Syed Sulaiman M
   */
  List.createField = (ctx, id, additionalFieldReq, callback) => {
    if(!additionalFieldReq.name)
      return callback(errorMessages.INVALID_FIELD_NAME);
    additionalFieldReq.name = additionalFieldReq.name.trim();
    var fieldName = additionalFieldReq.name;
    var firstChar = fieldName.charAt(constants.ZERO);
    var index = firstChar.search(/[a-z]/i);
    if(index === constants.MINUS_ONE)
      return callback(errorMessages.INVALID_FIELD_NAME);
    async.parallel({
      additionalField: async.apply(
        List.app.models.additionalField.getByFieldNameLike, fieldName),
      list: (listCB) => {
        List.findById(id, (listErr, list) => {
          return listCB(listErr, list);
        });
      }
    }, (asyncErr, results) => {
      if(asyncErr) {
        logger.error("Error creating Field for List : ",
          {error: asyncErr, stack: asyncErr.stack, input: {listId: id}});
        return callback(errorMessages.SERVER_ERROR);
      }
      if(!results.list) return callback(errorMessages.INVALID_LIST_ID);
      createOrAssocField(results.list, additionalFieldReq,
          results.additionalField, (err, additionalField) => {
        if(err) {
          logger.error("Error creating Field for List : ",
            {error: err, stack: err.stack, input: {listId: id}});
          return callback(errorMessages.SERVER_ERROR);
        }
        return callback(null, additionalField);
      });
    });
  };

  List.remoteMethod(
    "associateField",
    {
      description: "To Associate Field to List",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number", required: true, http: {source: "path"}},
        {arg: "fieldId", type: "number", required: true, http:{source: "path"}},
      ],
      returns: {arg: "additionalField", type: "additionalField",
          root: true},
      http: {verb: "put", path: "/:id/field/:fieldId"}
    }
  );
  /**
   * Method to create Additional field for a List
   * @param  {Context} ctx
   * @param  {Number} id  listId
   * @param  {Function}     callback
   * @return {AdditionalField}
   * @author Syed Sulaiman M
   */
  List.associateField = (ctx, id, fieldId, callback) => {
    async.parallel({
      additionalField: (additionalFieldCB) => {
        List.app.models.additionalField.findById(fieldId, (fieldErr, field) => {
          return additionalFieldCB(fieldErr, field);
        });
      },
      list: (listCB) => {
        List.findById(id, (listErr, list) => {
          return listCB(listErr, list);
        });
      }
    }, (asyncErr, results) => {
      if(asyncErr) {
        logger.error("Error associating Field to List : ",
          {error: asyncErr, stack: asyncErr.stack, input: {listId: id}});
        return callback(errorMessages.SERVER_ERROR);
      }
      let list = results.list;
      let additionalField = results.additionalField;
      if(!list) return callback(errorMessages.INVALID_LIST_ID);
      if(!additionalField) return callback(errorMessages.INVALID_FIELD_ID);
      let include = lodash.includes(constants.LIST_DEFAULT_FIELDS,
        additionalField.id);
      if(include) return callback(null, additionalField);
      list.fields.findById(additionalField.id, function(err, field) {
        if(field) return callback(null, field);
        assocAdditionalField(list, additionalField,
            (associatedFieldErr, associatedField) => {
          if(associatedFieldErr) {
            logger.error("Error associating Field to List : ",
              {error: associatedFieldErr, stack: associatedFieldErr.stack});
            return callback(errorMessages.SERVER_ERROR);
          }
          return callback(null, additionalField);
        });
      });
    });
  };

  /**
   * Method to create or associate AdditionalField to List
   * @param  {[type]}   additionalField [description]
   * @param  {Function} callback        [description]
   * @return {[type]}                   [description]
   * @author Syed Sulaiman M
   */
  const createOrAssocField = (list, additionalFieldReq, additionalField,
      callback) => {
    if(additionalField) {
      let include = lodash.includes(constants.LIST_DEFAULT_FIELDS,
          additionalField.id);
      if(include) return callback(null, additionalField);
      list.fields.findById(additionalField.id, function(err, field) {
        if(field) return callback(null, field);
        assocAdditionalField(list, additionalField,
            (associatedFieldErr, associatedField) => {
          if(associatedFieldErr) return callback(associatedFieldErr);
          return callback(null, additionalField);
        });
      });
    } else {
      createAdditionalField(list, additionalFieldReq,
        (additionalFieldErr, additionalField) => {
        if(additionalFieldErr) return callback(additionalFieldErr);
        return callback(null, additionalField);
      });
    }
  };

  /**
   * Method to create and associate AdditionalField to List
   * @param  {[type]}   additionalField [description]
   * @param  {Function} callback        [description]
   * @return {[type]}                   [description]
   * @author Syed Sulaiman M
   */
  const createAdditionalField = (list, additionalField, callback) => {
    list.fields.create(additionalField,
        (additionalFieldErr, additionalField) => {
      if(additionalFieldErr) {
        logger.error("Error creating additionalField for list : ",
          {error: additionalFieldErr, stack: additionalFieldErr.stack});
        return callback(errorMessages.SERVER_ERROR);
      }
      return callback(null, additionalField);
    });
  };

  /**
   * Method to associate AdditionalField to List
   * @param  {[type]}   additionalField [description]
   * @param  {Function} callback        [description]
   * @return {[type]}                   [description]
   * @author Syed Sulaiman M
   */
  const assocAdditionalField = (list, additionalField, callback) => {
    list.fields.add(additionalField,
        (associatedFieldErr, associatedField) => {
      if(associatedFieldErr) {
        logger.error("Error associatng additionalField for list : ",
          {error: associatedFieldErr, stack: associatedFieldErr.stack});
        return callback(errorMessages.SERVER_ERROR);
      }
      return callback(null, associatedField);
    });
  };

  /**
   * Associating the ListIds with campgin
   * @param  {[Campaign]} campaign
   * @param  {List[number]} listIds
   * @param  {[function]} associateListCB [callback function]
   * @return {void}
   * @author Ramanavel Selvaraju
   */
  List.associateList = (campaign, listIds, associateListCB) => {
   async.each(listIds, (listId, listEachCB) => {
     campaign.lists.add(listId, (listAddErr) => {
       if(listAddErr) {
         logger.error("Error on associating the list : ",
            {campaign: campaign, listId: listId, error: listAddErr,
              stack: listAddErr.stack});
       }
       listEachCB(listAddErr);
     });
   }, (listEachErr) => {
      associateListCB(listEachErr);
   });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  List.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
