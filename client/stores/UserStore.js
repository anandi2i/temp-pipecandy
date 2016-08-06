import _ from "underscore";
import {EventEmitter} from "events";
import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";
import UserApi from "../API/UserApi";
import {SuccessMessages} from "../utils/UserAlerts";
import {HandleError} from "../utils/ErrorMessageHandler";
import {browserHistory} from "react-router";

let _user = {};
let _prevLocation = "";
let _error = "";
let _success = "";
let isSocialAuth = false;

/**
 * Has a list of success messages that the toast display
 */
const UserStore = _.extend({}, EventEmitter.prototype, {

  /**
   * Emit Change event
   */
  emitChange() {
    this.emit("change");
  },

  /** Add change listener
   * @param {function} callback
   */
  addChangeListener(callback) {
    this.on("change", callback);
  },

  /** Remove change listener
   * @param {function} callback
   */
  removeChangeListener(callback) {
    this.removeListener("change", callback);
  },

  /**
   * Gets user data
   * @return {object} user details
   */
  getUser() {
    return _user;
  },

  /**
   * Gets error message if any
   * @return {string} error message
   */
  getError() {
    return _error;
  },

  /**
   * Sets previous location
   * @param {string} path name
   */
  setPrevLocation(location) {
    if (location === "/email-verified" || location === "response" ||
       location === "/response") {
      _prevLocation = "/";
    } else {
      _prevLocation = location;
    }
  },

  /**
   * Gets success message if any
   * @return {string} success message
   */
  getSuccess() {
    return _success;
  },

  /**
   * Check if the user is using social login
   * @return {boolean} is social authenticated
   */
  isSocialAuth() {
    return isSocialAuth;
  }

});

AppDispatcher.register(function(payload) {
  const {action} = payload;
  switch (action.actionType) {
    case Constants.REGISTER:
      UserApi.register(action.data).then((response) => {
        response.data.avatar = "/images/photo.png";
        _user = response.data;
        _error = "";
        browserHistory.push("/response");
      }, (err)=> {
        _user = {};
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.LOGIN:
      UserApi.login(action.data).then((response) => {
        _user = response.data.userData;
        _error = "";
        browserHistory.push(_prevLocation);
        enabledropDownBtn();
      }, (err)=> {
        _user = {};
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.SET_USER_DETAIL:
      _user = action.data;
      isSocialAuth = false;
      if(_.isEmpty(_user)) {
        browserHistory.push("/register");
      } else if(_user.identities[0] && _user.identities[0].profile) {
        isSocialAuth = true;
        if(!_user.firstName && _user.identities[0].profile.name) {
          _user.firstName = _user.identities[0].profile.name.givenName || "";
          _user.lastName = _user.identities[0].profile.name.familyName || "";
        }
        if(_user.identities[0].profile.emails) {
          _user.email = _user.identities[0].profile.emails[0].value || "";
        }
        UserStore.emitChange();
      }
      break;
    case Constants.LOGOUT:
      UserApi.logout().then((response) => {
        _user = "";
        isSocialAuth = false;
        _prevLocation = "/";
        browserHistory.push("/login");
      });
      break;
    case Constants.USER_UPDATE:
      UserApi.userUpdate(action.data).then((response) => {
        _user = response.data;
        if(_user.avatar) {
          _user.avatar = `${_user.avatar}?${new Date().getTime()}`;
        }
        _success = SuccessMessages.successUpdate;
        UserStore.emitChange();
        _success = "";
      }, (err) => {
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.FORGOT_PASSSWORD:
      UserApi.forgotPassword(action.data).then((response) => {
        browserHistory.push("/forgot-password-response");
      }, (err) => {
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.RESET_PASSSWORD:
      UserApi.resetPassword(action.data).then((response) => {
        browserHistory.push("/reset-password-response");
      }, (err) => {
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.UNSUBSCRIBE_CAMPAIGN:
      UserApi.unsubscribe(action.id).then((response) => {
        //TODO need to hadle success res
      }, (err) => {
        //TODO need to hadle err
      });
      break;
    default:
      return true;
  }
  return true;
});

export default UserStore;
