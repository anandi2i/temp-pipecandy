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
