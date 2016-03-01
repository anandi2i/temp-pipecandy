import AppDispatcher from "../dispatcher/AppDispatcher";
import {EventEmitter} from "events";
import Constants from "../constants/Constants";
import _ from "underscore";
import UserApi from "../API/UserApi";
import router from "../RouteContainer";

let _user = {};

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
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  const {action} = payload;
  switch (action.actionType) {
    case Constants.REGISTER:
      UserApi.register(action.data).then((response) => {
        _user = response.data;
        UserStore.emitChange();
        router.transitionTo("/response");
      });
      break;
    case Constants.LOGIN:
      UserApi.login(action.data).then((response) => {
        _user = response.data;
        UserStore.emitChange();
        router.transitionTo("/home");
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
