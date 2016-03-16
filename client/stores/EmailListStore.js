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
      EmailListApi.crateList(action.data).then((response) => {
        _allEmailList = {};
        _error = "";
        appHistory.push("list/"+response.data.id);
      }, (err)=> {
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.GET_LIST_BY_ID:
      EmailListApi.getList(action.data).then((response) => {
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
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
