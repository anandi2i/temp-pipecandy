"use strict";

import logger from "../../server/log";
import lodash from "lodash";

module.exports = function(List) {

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
   *  "firstName": "Test FN",
   *  "middleName": "Test MN",
   *  "lastName": "Test LN",
   *  "email": "test@ideas2it.com",
   *  "fieldVaules":  [{
   *      "value": "test1",
   *      "fieldId": 1
   *    },{
   *      "value": "test2",
   *      "fieldId": 2
   *    }]
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
      list[0].people.create(reqParams.person,
        (createPersonErr, persistedPerson) => {
        if(createPersonErr) {
          logger.error("Error in saving Person Object : ", reqParams);
          return savePersonWithFieldsCB(createPersonErr);
        }
        persistedPerson.fieldValues.create(reqParams.fieldValues,
          (fieldValuesCreateErr, persistedFieldValues) => {
            if(fieldValuesCreateErr) {
              logger.error("Error in saving fields : ", reqParams);
              return savePersonWithFieldsCB(fieldValuesCreateErr);
            }
          return savePersonWithFieldsCB(null, {
            person: persistedPerson,
            fieldValues: persistedFieldValues
          });
        });
      }); //people save
    }); //list find
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
