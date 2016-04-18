/**
 * Has a list of error messages that the toast display
 * @type {object} error messages
 */
export const ErrorMessages = {
  "LOGIN_FAILED": "It looks like you've got it wrong. " +
    "Could you try again, please?",
  "ValidationError": "Oh, no! Somebody had registered already " +
    "with that email id. If that's you try 'Forgot Password'!",
  "InvalidCorporateEmail": "Please provide valid corporate email",
  "InvalidPassChange": "Please enter valid password",
  "ErrorInUpdatePass": "Error in update password",
  "ErrorInGettingUser": "Error in getting user",
  "NetworkError": "The server seems to be down",
  "MiscellaneousError": "something went wrong. could you please try again",
  "EMAIL_NOT_FOUND": "The requested email doesn't exist"
};

/**
 * Has a list of success messages that the toast display
 * @type {object} success messages
 */
export const SuccessMessages = {
  "successUpdate": "Update successfully",
  "successSubscribeUpdate": "Subscriber details updated successfully",
  "successUpload": "The file has been uploaded successfully",
  "successSubscribe": "Subscriber details saved successfully"
};
