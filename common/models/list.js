"use strict";

import logger from "../../server/log";
import lodash from "lodash";
import async from "async";
import _ from "underscore";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
const emptycount = 0;

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
              if(getPoepleByListForEmailErr.name === `StatusMismatchError`) {
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
   * @author Ramanavel Selvaraju
   */
  List.savePersonWithFields = (ctx, id, reqParams, savePersonWithFieldsCB) => {
    List.find({
       where: {id: id, createdBy: ctx.req.accessToken.userId}
     }, (listErr, list) => {
      if(listErr | lodash.isEmpty(list)) {
         logger.error("Error in getting List for id : ", id);
         return savePersonWithFieldsCB(listErr);
      }
      emailExistCheck(reqParams.person.email, (checkErr, person) => {
        if(lodash.isEmpty(person)){
          let personObject = {
             firstName: reqParams.person.firstName,
             middleName: reqParams.person.middleName,
             lastName: reqParams.person.lastName,
             email: reqParams.person.email
           };
          createPersonAndAdditionalFields(list[0], personObject,
            reqParams.person.fieldValues, (createErr, createdPerson) => {
             if(createErr){
               logger.error("Error while creating person and fieldValues",
                {error: createErr, stack: createErr ? createErr.stack : ""});
               savePersonWithFieldsCB(createErr);
             }
             savePersonWithFieldsCB(null, createdPerson);
           });
        } else{
          let newPersonObject = {
             firstName: reqParams.person.firstName,
             middleName: reqParams.person.middleName,
             lastName: reqParams.person.lastName,
             email: reqParams.person.email
          };
          updatePersonAuditAndAdditionalFields(list[0], person[0],
            newPersonObject, reqParams.person.fieldValues,
            (createErr, createdPerson) => {
          if(createErr){
           logger.error("Error while creating person and fieldValues",
            {error: createErr, stack: createErr ? createErr.stack : ""});
           savePersonWithFieldsCB(createErr);
          }
          savePersonWithFieldsCB(null, createdPerson);
          });
        }
      });
    });
  };

  /**
   * While creating new recepient, if there is no person saved with recepient's
   * email before we need to create person and additionalField values
   * @param  {[list]} list
   * @param  {[personObject]} personObject
   * @param  {[additionalFields]} additionalFields
   * @param  {[function]} createPersonAndAdditionalFieldsCB
   * @return {[createdPerson]}
   * @author Aswin Raj A
   */
  let createPersonAndAdditionalFields = (list, personObject, additionalFields,
     createPersonAndAdditionalFieldsCB) => {
   async.waterfall([
     async.apply(createPerson, list, personObject, additionalFields),
     createAdditionalFields
   ], (asyncErr, createdPerson) => {
     if(asyncErr){
       logger.error("Error while creating person and additional fields",
        {error: asyncErr, stack: asyncErr ? asyncErr.stack : ""});
       return createPersonAndAdditionalFieldsCB(asyncErr);
     }
     return createPersonAndAdditionalFieldsCB(null, createdPerson);
   });
  };

  /**
   * To create a person for the list
   * @param  {[list]} list
   * @param  {[personObject]} personObject
   * @param  {[fields]} fields
   * @param  {[function]} createPersonCB
   * @return {[createdPerson, fields]}
   * @author Aswin Raj A
   */
  let createPerson = (list, personObject, fields, createPersonCB) => {
    list.people.create(personObject, (listPeopleCreateErr, createdPerson) => {
      if(listPeopleCreateErr){
        logger.error("Error while creating person for the list",
         {error: listPeopleCreateErr,
           stack: listPeopleCreateErr ? listPeopleCreateErr.stack : ""});
        createPersonCB(listPeopleCreateErr);
      }
      createPersonCB(null, createdPerson, fields);
    });
  };

  /**
   * Create additionalField values for the created Person
   * @param  {[createdPerson]} createdPerson
   * @param  {[fields]} fields
   * @param  {[function]} createAdditionalFieldsCB
   * @return {[createdPerson]}
   * @author Aswin Raj A
   */
  let createAdditionalFields = (createdPerson, fields,
    createAdditionalFieldsCB) => {
    let fieldValues = [];
    async.eachSeries(fields, (field, fieldsCB) => {
      let fieldValueObj = {
        "fieldId":  field.fieldId,
        "listId": parseInt(field.listId),
        "personId": createdPerson.id,
        "value": field.value
      };
      List.app.models.additionalFieldValue.create(fieldValueObj,
        (fieldCreateErr, createdField) => {
        if(fieldCreateErr){
          logger.error("Error while creating additional fields",
           {error: fieldCreateErr,
             stack: fieldCreateErr ? fieldCreateErr.stack : ""});
          createAdditionalFieldsCB(fieldCreateErr);
        }
        fieldValues.push(createdField);
        fieldsCB(null);
      });
    }, (err) => {
      if(err){
        logger.error("Error while creatign additionalField values",
         {error: err, stack: err ? err.stack : ""});
         createAdditionalFieldsCB(err);
      }
      let person = JSON.parse(JSON.stringify(createdPerson));
      person.fieldValues = JSON.parse(
        JSON.stringify(fieldValues)
      );
      createAdditionalFieldsCB(null, person);
    });
  };

  /**
   * While creating a new recepient, if there already exist a entry with the
   * same recepient's email then update person and additionalField values and
   * create an entry in personAudit table
   * @param  {[list]} list
   * @param  {[person]} person
   * @param  {[newPersonObject]} newPersonObject
   * @param  {[additionalFields]} additionalFields
   * @param  {[function]} updatePersonAuditAndAdditionalFieldsCB
   * @return {[type]}
   * @author Aswin Raj A
   */
  let updatePersonAuditAndAdditionalFields = (list, person,
   newPersonObject, additionalFields,
   updatePersonAuditAndAdditionalFieldsCB) => {
     async.waterfall([
       async.apply(createPersonAudit, list, person, newPersonObject,
         additionalFields),
       updateCurrentPerson,
       updateAdditionalFieldValues
     ], (asyncErr, updatedPerson) => {
       if(asyncErr){
         logger.error("Error while updating the person audit and\
          additionalFieldValue",
          {error: asyncErr, stack: asyncErr ? asyncErr.stack : ""});
         return updatePersonAuditAndAdditionalFieldsCB(asyncErr);
        }
       return updatePersonAuditAndAdditionalFieldsCB(null, updatedPerson);
     });
   };

  /**
   * First step in updatePersonAuditAndAdditionalFields
   * - To create an entry in person audit table
   * @param  {[list]} list
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[additionalFields]} additionalFields
   * @param  {[function]} createPersonAuditCB
   * @return {[newPerson, oldPersonId, list, additionalFields]}
   * @author Aswin Raj A
   */
  let createPersonAudit = (list, oldPerson, newPerson, additionalFields,
    createPersonAuditCB) => {
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
    if(oldPerson.salutation !== newPerson.salutation){
      auditPersonObj.salutation = oldPerson.salutation;
    }

    if(Object.getOwnPropertyNames(auditPersonObj).length !== emptycount){
      auditPersonObj.personId = oldPerson.id;
      List.app.models.personAudit.create(auditPersonObj,
        (auditCreateErr, createdPersonAudit) => {
      if(auditCreateErr){
        logger.error("Error while creating Person Audit",
        {error: auditCreateErr,
        stack: auditCreateErr ? auditCreateErr.stack : ""});
        return createPersonAuditCB(auditCreateErr);
      }
        return createPersonAuditCB(null, newPerson, oldPerson.id, list,
        additionalFields);
      });
    } else{
      createPersonAuditCB(null, newPerson, oldPerson.id, list,
        additionalFields);
    }
  };

  /**
   * Secone step in updatePersonAuditAndAdditionalFields
   * - To update the current person data with the recent values
   * @param  {[newPerson]} newPerson
   * @param  {[personId]} personId
   * @param  {[list]} list
   * @param  {[additionalFields]} additionalFields
   * @param  {[function]} updatePersonCB
   * @return {[personId, list, additionalFields]}
   * @author Aswin Raj A
   */
  let updateCurrentPerson = (newPerson, personId, list, additionalFields,
     updatePersonCB) => {

    List.app.models.person.findById(personId, (personFindErr, person) => {
     if(personFindErr){
       logger.error("Error while finding person",
        {error: personFindErr,
          stack: personFindErr ? personFindErr.stack : ""});
       return updatePersonCB(personFindErr);
     }
     person.updateAttributes(newPerson,
       (personUpdateErr, updatedPerson) => {
       if(personUpdateErr){
         logger.error("personUpdateErr",
          {error: personUpdateErr,
            stack: personUpdateErr ? personUpdateErr.stack : ""});
         return updatePersonCB(personUpdateErr);
       }
       return updatePersonCB(null, personId, list, additionalFields,
         updatedPerson);
     });
    });
  };

  /**
   * Third step in updatePersonAuditAndAdditionalFields
   * - To update the additionalField values for the current person
   * @param  {[personId]} personId
   * @param  {[list]} list
   * @param  {[additionalFields]} additionalFields
   * @param  {[function]} updateAdditionalFieldValuesCB
   * @return {[type]}
   * @author Aswin Raj A
   */
  let updateAdditionalFieldValues = (personId, list, additionalFields,
    updatedPerson, updateAdditionalFieldValuesCB) => {
    let fieldValues = [];
    async.eachSeries(additionalFields, (additionalField,
      additionalFieldsCB) => {
     List.app.models.additionalFieldValue.find({
       where: {
         and: [
           {personId : personId},
           {listId: additionalField.listId},
           {fieldId: additionalField.fieldId}
         ]
       }
     }, (fieldFindErr, fieldData) => {
       fieldData[0].updateAttribute("value",
         additionalField.value, (fieldUpdateErr, updatedField) => {
         if(fieldUpdateErr){
           logger.error("Error while updating additionalField value",
            {error: fieldUpdateErr,
              stack: fieldUpdateErr ? fieldUpdateErr.stack : ""});
              return updateAdditionalFieldValuesCB(fieldUpdateErr);
         }
         fieldValues.push(fieldData[0]);
         additionalFieldsCB(null);
       });
     });
    }, (err) => {
     if(err){
       logger.error("Error while updating additionalField",
        {error: err, stack: err ? err.stack : ""});
        return updateAdditionalFieldValuesCB(err);
     }
     let person = JSON.parse(JSON.stringify(updatedPerson));
     person.fieldValues = JSON.parse(
       JSON.stringify(fieldValues)
     );
     return updateAdditionalFieldValuesCB(null, person);
    });
  };

  /**
   * Check if there exist any email in the table with the email created
   * if the current email exist in the table already, then return that person
   * @param  {[personEmail]} personEmail
   * @param  {[function]} emailExistCheckCB
   * @return {[people]}
   * @author Aswin Raj A
   */
  let emailExistCheck = (personEmail, emailExistCheckCB) =>{
    List.app.models.person.find({
      where : {
        email : personEmail
      }
    }, (emailFindErr, people) => {
      if(emailFindErr){
        logger.error("Error while finding email",
         {error: emailFindErr, stack: emailFindErr ? err.stack : ""});
        return emailExistCheckCB(emailFindErr);
      }
      return emailExistCheckCB(null, people);
    });
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
   *
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
        verb: "delete",
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
