import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

/**
 * Contains a list of action that are called upon from
 * the components
 */
const UserAction = {
  /**
   * fetch values from component and sends them to the store
   * for database storage
   *
   * @param {object} user - details of the perticular user
   * @emits {Constants.REGISTER}
   */
  register(user) {
    AppDispatcher.handleAction({
      actionType: Constants.REGISTER,
      data: user
    });
  },

  /**
   * Receives email and password from the user and it is used
   * to make an api call to fetch the user id
   *
   * @param {object} user - containing the email and password of the user
   * @emits {Constants.LOGIN}
   */
  login(user) {
    AppDispatcher.handleAction({
      actionType: Constants.LOGIN,
      data: user
    });
  },

  /**
   * gets details of the user and then displays it
   *
   * @param {object} user - details of the perticular user
   * @emits {Constants.SET_USER_DETAIL}
   */
  setUserDetail(user) {
    AppDispatcher.handleAction({
      actionType: Constants.SET_USER_DETAIL,
      data: user
    });
  },

  /**
   * Performs the operation of logout for set user
   *
   * @emits {Constants.LOGOUT}
   */
  logout() {
    AppDispatcher.handleAction({
      actionType: Constants.LOGOUT
    });
  },

  /**
   * Gets updated values from the user which is the used to modify
   * the database by making and api call with the user id and
   * updated values
   *
   * @param {object} user - details of the perticular user
   * @emits {Constants.USER_UPDATE}
   */
  userUpdate(user) {
    AppDispatcher.handleAction({
      actionType: Constants.USER_UPDATE,
      data: user
    });
  },

  /**
   * Receives the email address of the user who lost his
   * password and proper set deails are sent to the respective
   * users email address
   *
   * @param {string} email -the email address of set user
   * @emits {Constants.FORGOT_PASSSWORD}
   */
  forgotPassword(email) {
    AppDispatcher.handleAction({
      actionType: Constants.FORGOT_PASSSWORD,
      data: email
    });
  },

  /**
   * Updated the users password with new value
   *
   * @param {object} password - constains the password and accesstoken
   * of the user
   * @emits {Constants.RESET_PASSSWORD}
   */
  resetPassword(password) {
    AppDispatcher.handleAction({
      actionType: Constants.RESET_PASSSWORD,
      data: password
    });
  }
};

export default UserAction;
