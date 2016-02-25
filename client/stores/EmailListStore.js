import AppDispatcher from "../dispatcher/AppDispatcher";
import {EventEmitter} from "events";
import Constants from "../constants/Constants";
import _ from "underscore";
import {EmailListApi} from "../API/EmailListApi";

let _emailList = [];

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const EmailListStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitChange: function() {
    this.emit("change");
  },

  // Add change listener
  addChangeListener: function(callback) {
    this.on("change", callback);
  },

  // Remove change listener
  removeChangeListener: function(callback) {
    this.removeListener("change", callback);
  },

  getEmailList: function() {
    return _emailList;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.EMAIL_LIST:
      _emailList = EmailListApi.find();
      EmailListStore.emitChange();
      break;
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
