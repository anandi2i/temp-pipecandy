import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

// Define action methods
const EmailListActions = {
  getAllEmailList: function() {
    AppDispatcher.handleAction({
      actionType: Constants.EMAIL_LIST
    });
  }
};

export default EmailListActions;
