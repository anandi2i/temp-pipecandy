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
  "LOGIN_FAILED_EMAIL_NOT_VERIFIED": "Please verify your email address",
  "NetworkError": "The server seems to be down",
  "MiscellaneousError": "something went wrong. could you please try again",
  "EMAIL_NOT_FOUND": "The requested email doesn't exist",
  "FileUploadInvalidEmail": "One or more rows doesn't have valid email Id",
  "FileUploadInvalidHeader": "File Header is not in valid format",
  "FileUploadFnameEmpty": "One or more rows have empty first name",
  "ExistsCampaign": "Campaign name already exist",
  "LIST_EXISTS": "List name already exist",
  "CAMPAIGN_EXISTS": "Campaign name already exist",
  "DeletePerson" : "Please select a Subscriber to Delete",
  "MinFileSize": "Select file size more the 10kb",
  "PasswordFields": "Please enter both password fields",
  "InValidFileType": "Please upload file of type csv/xls",
  "SamePasswordUpdate": "Please update new different password",
  "EmptyEmailList": "Email list should not be empty",
  "SmartTagIssues": "Fix all smart tag issues"
};

/**
 * Has a list of success messages that the toast display
 * @type {object} success messages
 */
export const SuccessMessages = {
  "successUpdate": "Update successfully",
  "successSubscribeUpdate": "Subscriber details updated successfully",
  "successUpload": "The file has been uploaded successfully",
  "successSubscribe": "Subscriber details saved successfully",
  "successDelete": "Deleted successfully",
  "successSelectTemplate": "has been selected",
  "successAddAdditionalField": "Additional field added successfully"
};
