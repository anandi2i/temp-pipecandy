import _ from "underscore";
import logger from "../../server/log";
import lodash from "lodash";

module.exports = function(AdditionalField) {

  /**
   * For: CSV - Upload and Add Recepient
   * Get all the additionalField where userId is null, implying common
   * additionalField
   * @param  {[listid]} listid
   * @param  {[function]} getAllDefaultFieldsCB
   * @return {[defaultAdditionalFields, listid]}
   * @author Aswin Raj A
   */
    AdditionalField.getAllDefaultFields = (listid, getAllDefaultFieldsCB) => {
    AdditionalField.find({
      where : {
        userId : null
      }
    }, (fieldsFindErr, defaultFields) => {
      if(fieldsFindErr){
        logger.error("Error while finding default fields for the list", {
          error: fieldsFindErr,
          stack: fieldsFindErr ? fieldsFindErr.stack : ""
        });
        return getAllDefaultFieldsCB(fieldsFindErr);
      }
      let defaultAdditionalFields = _.pluck(defaultFields, "name");
      getAllDefaultFieldsCB(null, defaultAdditionalFields, listid);
    });
  };


  /**
   * For: CSV - Upload and Add Recepient
   * Get additionalFields for the current list
   * @param  {[listid]} listid
   * @param  {[function]} getAdditionalFieldsForListCB
   * @return {[fields]}
   * @author Aswin Raj A
   */
    AdditionalField.getAdditionalFieldsForList = (listid,
      getAdditionalFieldsForListCB) => {
    AdditionalField.app.models.list.findById(listid, (listFindErr, list) => {
      if(listFindErr){
        logger.error("Error while finding list", listid, {
          error: listFindErr,
          stack: listFindErr ? listFindErr.stack : ""
        });
        return savePersonWithAdditionalFieldsCB(listFindErr);
      }
      list.fields((listFieldErr, fields) => {
        if(listFieldErr){
          logger.error("Error while finding field for list", {
            listid: listid,
            error: listFieldErr,
            stack: listFieldErr ? listFieldErr.stack : ""
          });
          return savePersonWithAdditionalFieldsCB(listFieldErr);
        }
        fields = fields.map(field => {
          return {
            "name" : field.name,
            "id" : field.id
          };
        });
        getAdditionalFieldsForListCB(null, fields);
      });
    });
  };

  /**
   * For: CSV - Upload and Add Recepient
   * Get all additionalField for the listid,
   * @param  {[defaultAdditionalFields]} defaultAdditionalFields
   * @param  {[listid]} listid
   * @param  {[function]} getAllAdditionalFieldsForListCB
   * @return {[allAdditionalFields]}
   * @author Aswin Raj A
   */
  AdditionalField.getAllAdditionalFieldsForList = (defaultAdditionalFields,
    listid, getAllAdditionalFieldsForListCB) => {
    AdditionalField.app.models.list.findById(listid, (listFindErr, list) => {
      if(listFindErr){
        logger.error("Error while finding list", {
          error: listFindErr,
          stack: listFindErr ? listFindErr.stack : ""
        });
        return getAllAdditionalFieldsForListCB(listFindErr);
      }
      list.fields((fieldErr, fields) => {
        if(fieldErr){
          logger.error("Error while finding fields for list:", {
            listid: listid,
            error: fieldErr,
            stack: fieldErr ? fieldErr.stack : ""
          });
          return getAllAdditionalFieldsForListCB(fieldErr);
        }
        let allAdditionalFields = lodash.concat(defaultAdditionalFields,
          _.pluck(fields, "name"));
        getAllAdditionalFieldsForListCB(null, allAdditionalFields);
      });
    });
  };


  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  AdditionalField.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
