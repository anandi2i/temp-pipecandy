import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

// Define action methods
const UserAction = {
  register(user) {
    AppDispatcher.handleAction({
      actionType: Constants.REGISTER,
      data: user
    });
  },

  login(user) {
    AppDispatcher.handleAction({
      actionType: Constants.LOGIN,
      data: user
    });
  },

  getUserDetail() {
    AppDispatcher.handleAction({
      actionType: Constants.USER_DETAIL
    });
  },

  logout() {
    AppDispatcher.handleAction({
      actionType: Constants.LOGOUT
    });
  }
};

export default UserAction;
