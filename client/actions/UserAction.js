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

  setUserDetail(user) {
    AppDispatcher.handleAction({
      actionType: Constants.SET_USER_DETAIL,
      data: user
    });
  },

  logout() {
    AppDispatcher.handleAction({
      actionType: Constants.LOGOUT
    });
  },

  userUpdate(user){
    AppDispatcher.handleAction({
      actionType: Constants.USER_UPDATE,
      data: user
    });
  }
};

export default UserAction;
