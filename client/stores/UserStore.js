import _ from "underscore";
import {EventEmitter} from "events";
import cookie from "react-cookie";
import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";
import UserApi from "../API/UserApi";
import {SuccessMessages} from "../utils/UserAlerts";
import {HandleError} from "../utils/ErrorMessageHandler";
import appHistory from "../RouteContainer";

let _user = {};
let _error = "";
let _success = "";

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
   * Gets success message if any
   * @return {string} success message
   */
  getSuccess() {
    return _success;
  }

});

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
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.LOGIN:
      UserApi.login(action.data).then((response) => {
        _user = response.data.userData;
        _error = "";
        cookie.save("userId", _user.id, {path: "/"});
        appHistory.push("home");
      }, (err)=> {
        _user = {};
        _error = HandleError.evaluateError(err);
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
        cookie.remove("userId", {path: "/"});
        appHistory.push("/login");
      });
      break;
    case Constants.USER_UPDATE:
      UserApi.userUpdate(action.data).then((response) => {
        _user = response.data;
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
        appHistory.push("/forgot-password-response");
      }, (err) => {
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    case Constants.RESET_PASSSWORD:
      UserApi.resetPassword(action.data).then((response) => {
        appHistory.push("/reset-password-response");
      }, (err) => {
        _error = HandleError.evaluateError(err);
        UserStore.emitChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default UserStore;
