const requiredIndex = -1;
import {ErrorMessages} from "../utils/UserAlerts";

export const HandleError = {

  /** Serves the purpose of assigning error messages
   * @return {string} _error - error message
   */
  evaluateError(err) {
    let errorString = err.toString();
    let _error = "";
    let errorIndex = errorString.indexOf("Network Error");
    if(errorIndex > requiredIndex) {
      _error = ErrorMessages.NetworkError;
    } else if(err.data.error) {
      if(err.data.error.code) {
        _error = ErrorMessages[err.data.error.code];
      } else if(err.data.error.name) {
        _error = ErrorMessages[err.data.error.name];
      }
    } else {
      _error = ErrorMessages.MiscellaneousError;
    }
    return _error;
  },
};
