import AppDispatcher from "../dispatcher/AppDispatcher";
import {EventEmitter} from "events";
import Constants from "../constants/Constants";
import _ from "underscore";
import UserApi from "../API/UserApi";
import router from "../RouteContainer";
import ErrorMessages from "../utils/ErrorMessages";

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
        UserStore.emitChange();
        router.transitionTo("/response");
      }, (err)=> {
        _user = {};
        _error = ErrorMessages[err.data.error.name];
        UserStore.emitChange();
      });
      break;
    case Constants.LOGIN:
      UserApi.login(action.data).then((response) => {
        _user = response.data.userData;
        UserStore.emitChange();
        router.transitionTo("/home");
      }, (err)=> {
        _user = {};
        _error = ErrorMessages[err.data.error.code];
        UserStore.emitChange();
      });
      break;
    case Constants.USER_DETAIL:
      UserApi.getUserDetail().then((response) => {
        _user = response.data;
        UserStore.emitChange();
      });
      break;
    case Constants.LOGOUT:
      UserApi.logout().then((response) => {
        _user = "";
        UserStore.emitChange();
        router.transitionTo("/");
      });
      break;
    default:
      return true;
  }
  return true;
});

export default UserStore;
