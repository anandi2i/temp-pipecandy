import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import EmailListApi from "../API/EmailListApi";
import appHistory from "../RouteContainer";

let _allEmailList = {};
let _getEmailList = {};
let _error = "";

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const EmailListStore = _.extend({}, EventEmitter.prototype, {

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

  getAllList() {
    return _allEmailList;
  },

  getEmailListByID() {
    return _getEmailList;
  },

  getPeopleByList() {
    let _peopleData = [];
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
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.CREATE_NEW_LIST:
      EmailListApi.createList(action.data).then((response) => {
        _allEmailList = {};
        _error = "";
        appHistory.push("list/"+response.data.id);
      }, (err)=> {
        _error = err;
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
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.FILE_UPLOAD:
      EmailListApi.uploadFile(action.data).then((response) => {
        //TODO: Change it to success message
        _error = "The file has been uploaded successfully";
        EmailListStore.emitChange();
      }, (err)=> {
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.SAVE_SINGLE_PERSON:
      EmailListApi.saveSinglePerson(action.data).then((response) => {
        //TODO: Change it to success message
        _error = "Subscriber details saved successfully";
        EmailListStore.emitChange();
      }, (err)=> {
        console.log("err", err);
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.UPDATE_SINGLE_PERSON:
      EmailListApi.updateSinglePerson(action.data).then((response) => {
        //TODO: Change it to success message
        _error = "Subscriber details updated successfully";
        EmailListStore.emitChange();
      }, (err)=> {
        console.log("err", err);
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
