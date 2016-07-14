import lodash from "lodash";
import async from "async";

module.exports = function(AdditionalFieldValue) {

  /**
   * Method to delete Field Values not in given List
   * @param {Number} personId
   * @param {Number} listId
   * @param {[Number]} fieldIds
   * @param {Function} callback
   * @author Syed Sulaiman M
   */
  AdditionalFieldValue.deleteNotInFields =
        (personId, listId, fieldIds, callback) => {
    AdditionalFieldValue.find({
      where: {
        personId: personId,
        listId: listId
      }
    }, (addFieldValuesErr, addFieldValues) => {
      let addFieldValueIds = lodash.map(addFieldValues, "id");
      addFieldValueIds = lodash.difference(addFieldValueIds, fieldIds);
      async.each(addFieldValueIds, (addFieldValueId, addFieldValueIdCB) => {
        AdditionalFieldValue.destroyById(addFieldValueId,
            (deleteErr, result) => {
          addFieldValueIdCB(deleteErr, result);
        });
      }, (asyncErr) => {
        return callback(asyncErr);
      });
    });
  };

  /**
   * Method to delete All Field Values of a Person
   * @param {Number} personId
   * @param {Number} listId
   * @param {Function} callback
   * @author Syed Sulaiman M
   */
  AdditionalFieldValue.deleteFields = (personId, listId, callback) => {
    AdditionalFieldValue.find({
      where: {
        personId: personId,
        listId: listId
      }
    }, (addFieldValuesErr, addFieldValues) => {
      let addFieldValueIds = lodash.map(addFieldValues, "id");
      async.each(addFieldValueIds, (addFieldValueId, addFieldValueIdCB) => {
        AdditionalFieldValue.destroyById(addFieldValueId,
            (deleteErr, result) => {
          addFieldValueIdCB(deleteErr, result);
        });
      }, (asyncErr) => {
        return callback(asyncErr);
      });
    });
  };

  /**
   * Create a new entry in the additional fields
   * @param  {[newField]} newField
   * @param  {[function]} createFieldCB
   * @author Aswin Raj A
   */
  AdditionalFieldValue.createFields = (newField, createFieldCB) => {
    AdditionalFieldValue.create(newField,
      (fieldCreateErr, field) => {
      if(fieldCreateErr){
        logger.error("Error while creating additionalFieldValue", {
          newField : newField,
          error: fieldCreateErr,
          stack: fieldCreateErr ? fieldCreateErr.stack : ""
        });
        return createFieldCB(fieldCreateErr);
      }
      createFieldCB(null, "Created Successfully!");
    });
  };

  /**
   * Update the existing additionalFields with the new fields
   * @param  {[oldField]} oldField
   * @param  {[newField]} newField
   * @param  {[function]} fieldUpdateCB
   * @author Aswin Raj A
   */
  AdditionalFieldValue.updateFields = (oldField, newField, fieldUpdateCB) => {
    oldField.updateAttributes(newField, (fieldUpdateErr, field) => {
      if(fieldUpdateErr){
        logger.error("Error while updating additional field values", {
          newField: newField,
          error: fieldUpdateErr,
          stack: fieldUpdateErr ? fieldUpdateErr.stack : ""
        });
        return fieldUpdateCB(fieldUpdateErr);
      }
      fieldUpdateCB(null, "Updated Successfully!");
    });
  };


  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  AdditionalFieldValue.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
