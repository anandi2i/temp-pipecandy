import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

// Define action methods
const UserAction = {
  login(user) {
    AppDispatcher.handleAction({
      actionType: Constants.LOGIN,
      data: user
    })
  },

  logout() {
    AppDispatcher.handleAction({
      actionType: Constants.LOGOUT
    })
  }
};

export default UserAction;
