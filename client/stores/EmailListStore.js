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
let _peopleData = [];
let _error = "";
let _success = "";

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

  //TODO need to get opens, clicks, spam and additions. Replace _.random by result.
  getAllList() {
    let _allEmailListFlattenData = [];
    let initialRange = 0;
    let subscriberCountEndRange = 10000;
    let endRange = 50;
    _.each(_allEmailList, function(obj, index) {
      _allEmailListFlattenData.push({
        id: obj.id,
        name: obj.name || "",
        query: obj.query || null,
        type: obj.type || null,
        createdFor: obj.createdFor || null,
        owner: obj.owner || "",
        subscriberCount: _.random(initialRange, subscriberCountEndRange),
        lastSentAt: (new Date(_.now() + _.random(initialRange, endRange)))
                    .toUTCString(),
        opens: _.random(initialRange, endRange) + "%",
        clicks: _.random(initialRange, endRange) + "%",
        spam: _.random(initialRange, endRange) + "%",
        additions: _.random(initialRange, endRange)
      });
    });
    return _allEmailListFlattenData;
  },

  getEmailListByID() {
    return _getEmailList;
  },

  getPeopleByListUpdated() {
    return _peopleData;
  },

  getPeopleByList() {
    _.each(_getEmailList, function(obj, index) {
      _.each(obj.people, function(obj, index) {
        let _temp = {
          id: obj.id,
          firstName: obj.firstName || "",
          middleName: obj.middleName || "",
          lastName: obj.lastName || "",
          email: obj.email || "",
          addField1: "",
          addField2: "",
          addField3: "",
          addField4: "",
          addField5: "",
          edit: ""};
        _.each(obj.fields, function(obj, index) {
          if (obj.name && obj.value) {
            _temp["addField"+(++index)] = obj.name + ": "+obj.value;
          }
        });
        _peopleData.push(_temp);
      });
    });
    return _peopleData;
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
      EmailListApi.findAll().then((response) => {
        _allEmailList = response.data;
        _error = "";
        EmailListStore.emitChange();
      }, (err)=> {
        _allEmailList = {};
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.CREATE_NEW_LIST:
      EmailListApi.createList(action.data).then((response) => {
        _allEmailList = {};
        _error = "";
        appHistory.push("list/"+response.data.id);
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.GET_LIST_BY_ID:
      let data = {"list":[action.data]};
      EmailListApi.getSelectedList(data).then((response) => {
        _getEmailList = response.data;
        _error = "";
        EmailListStore.emitChange();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.FILE_UPLOAD:
      EmailListApi.uploadFile(action.data).then((response) => {
        _success = SuccessMessages.successUpload;
        EmailListStore.emitChange();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.SAVE_SINGLE_PERSON:
      EmailListApi.saveSinglePerson(action.data).then((response) => {
        _success = SuccessMessages.successSubscribe;
        EmailListStore.emitChange();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.UPDATE_SINGLE_PERSON:
      EmailListApi.updateSinglePerson(action.data).then((response) => {
        _success = "Subscriber details updated successfully";
        let rowIndex = "";
        let data = response.data;
        rowIndex = _.findIndex(_peopleData, {id: data.id});
        let _temp = _peopleData[rowIndex];
        let i = 1;
        _.each(_temp, function(value, key) {
          if(key === "addField"+i) {
            if(data["field"+i]) {
              _temp["addField"+i] = data["field"+i] + ": " + data["value"+i];
            }
            i++;
          } else {
            _temp[key] = data[key];
          }
        });
        _peopleData[rowIndex] = _temp;
        EmailListStore.emitPersonUpdate();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
