"use strict";

import logger from "../../server/log";
import lodash from "lodash";
import async from "async";
import _ from "underscore";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";

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
    List.find({
       where: {id: {inq: list.ids}, createdBy: ctx.req.accessToken.userId},
       include: ["fields", {"people": ["fieldValues"]}]
     }, (ListErr, lists) => {
       if(ListErr) {
         logger.error("Error in getting people data for lists", list);
         return peopleWithFieldsCB(ListErr);
       }
      return peopleWithFieldsCB(null, lists);
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
   * @author Ramanavel Selvaraju, Aswin Raj A(Modified)
   */
  List.savePersonWithFields = (ctx, id, reqParams, savePersonWithFieldsCB) => {
    async.waterfall([
      async.apply(createOrUpdatePerson, ctx, reqParams, id),
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
          email : newPerson.email,
          error: err,
          stack: err ? err.stack : ""
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
        people[0].lists((listFindErr, list) => {
          if(listFindErr){
            logger.error("Error while finding list for person", {
              person: people[0],
              error: err,
              stack: err ? err.stack : ""
            });
            createOrUpdatePersonCB(listFindErr);
          }
          if(list[0].id === listId){
            updatePersonForList(people[0], newPerson,
              (updateErr, updatedPerson) => {
              if(updateErr){
                logger.error(updateErr);
                return createOrUpdatePersonCB(updateErr);
              }
              return createOrUpdatePersonCB(null, updatedPerson.id, listId,
                newAdditionalFields, updatedPerson);
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
      }
    });
  };

  /**
   * If there exist an email for the current list, then update the person for
   * the current list
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} updatePersonForListCB
   * @return {[person]}
   * @author Aswin Raj A
   */
  let updatePersonForList = (oldPerson, newPerson, updatePersonForListCB) => {
    async.waterfall([
      async.apply(List.app.models.person.generateAuditPersonObj,
        oldPerson, newPerson),
      List.app.models.person.savePersonAudit,
      List.app.models.person.updatePersonWithNewData
    ], (asyncErr, person) => {
      if(asyncErr){
        logger.error(asyncErr);
        return updatePersonForListCB(asyncErr);
      }
      return updatePersonForListCB(null, person);
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
          stack: listFindErr ? listFindErr.stack : ""
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
          updatePersonCB(asyncErr);
        }
        updatePersonCB(null, person);
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
            stack: fieldFindErr ? fieldFindErr.stack : ""
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
                  stack: fieldCreateErr ? fieldCreateErr.stack : ""
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
                  stack: fieldUpdateErr ? fieldUpdateErr.stack : ""
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
   * @author Syed Sulaiman M
   */
  List.updatePersonWithFields = (ctx, id, personId, reqParams, callback) => {
    let params = {
      userId: ctx.req.accessToken.userId,
      listId: id,
      personId: personId,
      reqParams: reqParams
    };
    async.waterfall([
      function getReqParams(getReqParamsCB) {
        getReqParamsCB(null, params);
      },
      updatePersonAndFieldValues,
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
   * @param  {[Object]}   params Contains Details of Person, Fields to be updated
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  const updatePersonAndFieldValues = (params, callback) => {
    List.find({
      where: {
        id: params.listId,
        createdBy: params.userId
      }
    }, (listsErr, lists) => {
      if (listsErr) {
        logger.error("Error in getting List for id : ", params.listId);
        const errorMessage = errorMessages.SERVER_ERROR;
        return callback(errorMessage);
      }
      if (lodash.isEmpty(lists)) {
        logger.error("Error in getting List for id : ", params.listId);
        const errorMessage = errorMessages.LIST_NOT_FOUND;
        return callback(errorMessage);
      }
      async.waterfall([
        function getReqParams(getReqParamsCB) {
          getReqParamsCB(null, lists[0], params);
        },
        updatePerson,
        updateFieldValues
      ], (error, list, person) => {
        if (error) {
          logger.error("Error while updating Person & Field Values", error);
          return callback(error);
        }
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

  /**
   * Updates a Person
   * @param  {[Object]}   list
   * @param  {[Object]}   params Contains Details of Person, Fields to be updated
   * @param  {Function} callback
   */
  const updatePerson = (list, params, callback) => {
    let person = params.reqParams.person;
    list.people.findById(person.id, (personErr, personInst) => {
      if (lodash.isEmpty(personInst)) {
        logger.error("Error getting Person: ", person.id, "in list", list.id);
        const errorMessage = errorMessages.PERSON_NOT_FOUND;
        return callback(errorMessage);
      }
      personInst.updateAttributes(person, (updatedPersonErr, updatedPerson) => {
        if (updatedPersonErr) {
          logger.error("Error in saving Person Object : ", personErr);
          const errorMessage = errorMessages.SERVER_ERROR;
          return callback(errorMessage);
        }
        return callback(null, list, updatedPerson, params);
      });
    });
  };


  /**
   * Updates Field Values
   * @param  {[Object]}   list
   * @param  {[Object]}   person
   * @param  {[Object]}   params Contains Details of Person, Fields to be updated
   * @param  {Function} callback
   */
  const updateFieldValues = (list, person, params, callback) => {
    let fieldValues = params.reqParams.person.fieldValues;
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
            fieldValueCB(createdFieldErr, createdField);
          });
        });
      } else {
        List.app.models.additionalFieldValue.findById(fieldValue.id,
            (addFieldValueErr, addFieldValue) => {
          if (addFieldValueErr) {
            fieldValueCB(addFieldValueErr);
          } else {
            if (lodash.isEmpty(addFieldValue)) {
              logger.error("Error in gettig Field Values");
              const errorMessage = errorMessages.FIELD_VALUES_NOT_FOUND;
              return callback(errorMessage);
            }
            addFieldValue.updateAttribute("value", fieldValue.value,
                  (updatedFieldErr, updatedField) => {
              fieldIds.push(updatedField.id);
              fieldValueCB(updatedFieldErr, updatedField);
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
      async.each(lists, (list, listsCB) => {
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
                const hundred = 100;
                let totalEmailReached =
                      listMetrics[0].sentEmails - listMetrics[0].bounced;
                listResponse.openPercentage = lodash.round(
                      (listMetrics[0].opened / totalEmailReached) * hundred);
                listResponse.clickPercentage = lodash.round(
                      (listMetrics[0].clicked / totalEmailReached) * hundred);
                listResponse.spamPercentage = lodash.round(
                      (listMetrics[0].spammed / totalEmailReached) * hundred);
              } else {
                listResponse.openPercentage = 0;
                listResponse.clickPercentage = 0;
                listResponse.spamPercentage = 0;
              }
              callback(null, listResponse);
            });
          },
          (callback) => {
            list.campaigns((campaignErr, campaigns) => {
              if (!lodash.isEmpty(campaigns)) {
                campaigns = lodash.sortBy(campaigns, "lastRunAt");
                let sizeToDec = 1;
                let campaign = campaigns[campaigns.length - sizeToDec];
                listResponse.lastRunAt = campaign.lastRunAt;
              } else {
                listResponse.lastRunAt = "0";
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
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "listId",
        type: "number",
        required: true,
        http: {
          source: "path"
        }
      }, {
        arg: "peopleIds",
        type: "array",
        required: true,
        http: {
          source: "body"
        }
      }],
      returns: {
        arg: "status",
        type: "string",
        root: true
      },
      http: {
        verb: "post",
        path: "/removePeople/:listId"
      }
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
