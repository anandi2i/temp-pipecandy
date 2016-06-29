import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import EmailListApi from "../API/EmailListApi";
import {HandleError} from "../utils/ErrorMessageHandler";
import {SuccessMessages} from "../utils/UserAlerts";
import appHistory from "../RouteContainer";

let _allEmailList = {};
let _getEmailList = {};
let _getEmailListByID = {};
let _error = "";
let _success = "";
let _getFields = {};

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const EmailListStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitPersonUpdate() {
    this.emit("changeUpdates");
  },

  // Emit Change event
  emitChange() {
    this.emit("change");
  },
  // Emit get meta fiels
  emitFields() {
    this.emit("getFields");
  },
  // Add listener for fields
  addFieldsListener(fieldsCB) {
    this.on("getFields", fieldsCB);
  },
  // Remove listener for fields
  removeFieldsListener(fieldsCB) {
    this.removeListener("getFields", fieldsCB);
  },
  // Add change listener
  addChangeListener(callback) {
    this.on("change", callback);
  },

  // Remove change listener
  removeChangeListener(callback) {
    this.removeListener("change", callback);
  },

  // Add change listener for updates
  addPersonChangeListener(callback) {
    this.on("changeUpdates", callback);
  },

  // Remove change listener for updates
  removePersonChangeListener(callback) {
    this.removeListener("changeUpdates", callback);
  },

  getFieldsFromStore() {
    return _getFields;
  },
  /**
   * @return {Array} All lists created by the current user
   */
  getAllList() {
    return _allEmailList;
  },

  getEmailListByID() {
    let emailListByID = _getEmailList[0];
    let _peopleData = [];
    const fieldsList = _.indexBy(emailListByID.fields, "id");
    const fieldsName = _.pluck(emailListByID.fields, "name");
    _.each(emailListByID.people, function(people, index) {
      let _temp = {
        id: people.id,
        select: people.id,
        firstName: people.firstName,
        middleName: people.middleName || "",
        lastName: people.lastName,
        email: people.email,
        edit: ""
      };
      _.each(fieldsName, fieldName => {
        _temp[fieldName] = "";
      });
      _.each(people.fieldValues, field => {
        _temp[fieldsList[field.fieldId].name] = field.value;
      });
      _peopleData.push(_temp);
    });
    _getEmailListByID = {
      id: emailListByID.id,
      name: emailListByID.name,
      people: _peopleData,
      fieldsName: fieldsName,
      listFields: emailListByID.fields,
      peopleDetails: emailListByID.people
    };
    return _getEmailListByID;
  },

  getPeopleByListUpdated() {
    return _getEmailListByID;
  },

  getError() {
    return _error;
  },

  getSuccess() {
    return _success;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.ALL_EMAIL_LIST:
      EmailListApi.getAllEmailList().then((response) => {
        _allEmailList = response.data;
        EmailListStore.emitChange();
      }, (err)=> {
        _allEmailList = {};
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.CREATE_NEW_LIST:
      EmailListApi.createList(action.data).then((response) => {
        _allEmailList = {};
        appHistory.push("list/"+response.data.id);
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.GET_LIST_BY_ID:
      let data = {"ids":[action.data]};
      EmailListApi.getSelectedList(data).then((response) => {
        _getEmailList = response.data;
        EmailListStore.emitChange();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.FILE_UPLOAD:
      EmailListApi.uploadFile(action.data).then((response) => {
        _success = SuccessMessages.successUpload;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.SAVE_SINGLE_PERSON:
      EmailListApi.saveSinglePerson(action.data).then((response) => {
        _getEmailList[0].people.push(response.data.person);
        _success = SuccessMessages.successSubscribe;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.UPDATE_SINGLE_PERSON:
      EmailListApi.updateSinglePerson(action.data).then((response) => {
        _success = SuccessMessages.successSubscribeUpdate;
        const index = _.findIndex(_getEmailList[0].people,
          {id:response.data.id});
        _getEmailList[0].people[index] = response.data;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.DELETE_PERSONS:
      EmailListApi.deletePersons(action.data).then((response) => {
        _success = SuccessMessages.successDelete;
        EmailListStore.emitChange();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.GET_FIELDS:
      EmailListApi.getFields(action.data).then((response) => {
        _getFields = response.data;
        EmailListStore.emitFields();
      }, (err) => {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitFields();
      });
      break;
    case Constants.SAVE_ADDITIONAL_FIELD:
      EmailListApi.saveAdditionalField(action.data).then((response) => {
        _success = SuccessMessages.successAddAdditionalField;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.RELATE_ADDITIONAL_FIELD:
      EmailListApi.relateAdditionalField(action.data).then((response) => {
        _success = SuccessMessages.successAddAdditionalField;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
