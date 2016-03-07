import AppDispatcher from "../dispatcher/AppDispatcher";
import {EventEmitter} from "events";
import Constants from "../constants/Constants";
import _ from "underscore";
import UserApi from "../API/UserApi";
import {ErrorMessages, SuccessMessages} from "../utils/UserAlerts";
import appHistory from "../RouteContainer";

let _user = {};
let _error = "";

// Extend User Store with EventEmitter to add eventing capabilities
const UserStore = _.extend({}, EventEmitter.prototype, {

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

  getUser: function() {
    return _user;
  },

  getError: function() {
    return _error;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  const {action} = payload;
  switch (action.actionType) {
    case Constants.REGISTER:
      UserApi.register(action.data).then((response) => {
        _user = response.data;
        _error = "";
        appHistory.push("response");
      }, (err)=> {
        _user = {};
        _error = ErrorMessages[err.data.error.name];
        UserStore.emitChange();
      });
      break;
    case Constants.LOGIN:
      UserApi.login(action.data).then((response) => {
        _user = response.data.userData;
        appHistory.push("home");
      }, (err)=> {
        _user = {};
        _error = ErrorMessages[err.data.error.code];
        UserStore.emitChange();
      });
      break;
    case Constants.SET_USER_DETAIL:
      _user = action.data;
      UserStore.emitChange();
      break;
    case Constants.LOGOUT:
      UserApi.logout().then((response) => {
        _user = "";
        appHistory.push("/login");
      });
      break;
    case Constants.USER_UPDATE:
      UserApi.userUpdate(action.data).then((response) => {
        _user = response.data;
        //TODO need to change success msg
        _error = SuccessMessages.successUpdate;
        UserStore.emitChange();
      }, (err) => {
        if(err.data.error){
          _error = ErrorMessages[err.data.error.name];
          UserStore.emitChange();
        }
      });
      break;
    default:
      return true;
  }
  return true;
});

export default UserStore;
