/**
 * Has a list of error messages that the toast display
 * @type {object} error messages
 */
export const ErrorMessages = {
  "LOGIN_FAILED": "It looks like you've got it wrong. Could you try again," +
    "please?",
  "ValidationError": "Oh, no! Somebody had registered already with that email" +
    " id. If that's you try 'Forgot Password'!",
  "InvalidCorporateEmail": "That looks like a personal email id. Could you " +
    "please try a work email id?",
  "InvalidPassChange": "Oops. Your email or password is wrong!",
  "ErrorInUpdatePass": "I’m sorry. I don’t seem to find that password!",
  "ErrorInGettingUser": "",
  "LOGIN_FAILED_EMAIL_NOT_VERIFIED": "I’ve just you an email confirmation. " +
    "Click the link in it and confirm please!",
  "NetworkError": "My bad. The server seems to be down.",
  "MiscellaneousError": "I got confused for a moment. Could you please" +
    " try again?",
  "EMAIL_NOT_FOUND": "Oops. Your email or password is wrong!",
  "FileUploadInvalidEmail": "It seems like there are some email ids " +
    "missing for one or more recipients. Could you fix them?",
  "FileUploadInvalidHeader": "File Header is not in valid format",
  "FileUploadFnameEmpty": "It seems like some recipients’ first names are " +
    "missing. Could you fix them?",
  "ExistsCampaign": "That campaign name already exists. Try another!",
  "LIST_EXISTS": "This list name is already taken. Please try another name!",
  "CAMPAIGN_EXISTS": "That campaign name already exists. Try another!",
  "DeletePerson" : "By default the delete option should be disabled and can " +
    "be enabled only after at least one recipient is selected",
  "MinFileSize": "Instead of specifying filesize why don’t you specify aspect" +
    " ratio? I’ve never seen anyone giving this kind of spec for photos",
  "PasswordFields": "Please fill in your old/new password!",
  "InValidFileType": "Uh oh! I can accept only csv formats for now.",
  "SamePasswordUpdate": "That password has been used in the past." +
    " Try a new one!",
  "SmartTagIssues": "In a hurry? You haven’t fixed the issues with " +
    "some smart tags yet!",
  "INVALID_FIELD_NAME": "Numeric, special char start letter not allowed) - " +
    "(Fields names can’t start with numbers or special characters. " +
    "House Rules!",
  "PERSON_EXISTS_IN_LIST" : "I find this email id already " +
    "in this list -- Skip / Overwrite",
  "INVALID_DATA": "Invalid data!",
  "SmartTagIssuesInFollowup": "It seems like some smart tags are missing in" +
    " your follow up email(s) ",
  "EmptyFollowupEmailContent": "Oops. You've not entered any email content" +
    " for your follow up email(s) ",
  "SmartTagIssuesInMainEmail": "You seem to have some issues with the smart" +
    " tags. Could you please fix them?",
  "EmptyOptAddress": "Could you please enter your address?",
  "EmptyOptText": " You seem to have forgotten to give your choice of" +
    " opt-out text.",
  "EmptyEmailContent": "Oops. Your first email is empty!",
  "EMPTY_SUBJECT": "There's no subject for your email. Could you " +
    "please fix that?",
  "EmptyEmailList": "Please select at least one email list to continue " +
    "with the campaign.",
  "EMPTY_CSV_UPLOAD": "It seems like you've uploaded an empty file. Try " +
    "uploading with some recipients again!",
  "INVALID_FIELDS": "There seems to be some invalid fields in the list!",
  "EMPTY_TEMPLATE": "Oops. It seems like you didn't create the template! ",
  "MISSING_TEMPLATE_NAME": "Oops. It seems like you forgot to fill your " +
    "template name!",
  "MISSING_TEMPLATE_CONTENT": "Oops. It seems like you forgot to fill your " +
    "template!",
  "EMPTY_EMAIL": "Oops. Your to email id seems to be empty!",
  "INVALID_EMAIL": "Oops! That doesn't seem like a right email id!",
  "INVALID_ACCESS_TOKEN": "Ooops. Something went wrong. Please logout and login"
};

/**
 * Has a list of success messages that the toast display
 * @type {object} success messages
 */
export const SuccessMessages = {
  "successUpdate": "Done. That’s taken care of!",
  "successSubscribeUpdate": "Got it. We've updated the details!",
  "successUpload": "The file has been uploaded. Yeehaw!",
  "successSubscribe": "Recipient details have been saved!",
  "successDelete": "Alright. We've removed the recipients from this list!",
  "successSelectTemplate": "You just selected the ‘$selectedTemplate’" +
    " template!",
  "successAddAdditionalField": "",
  "successImproveDelivery": "Your emails will be delivered over a period of" +
    " time, which is a good thing. Recommended",
  "WarningImproveDelivery": "All your emails would be delivered at one go " +
    "(instead of being delivered over a period of time). This might reduce" +
    " your email deliverability rates. Not recommended.",
  "TestMail": "Test mail sent successfully",
  "successCampaign": "Your campaign is on its way!"
};

/**
 * Has a list of alert messages on empty results
 * @type {object} alert messages
 */
export const resultsEmpty = {
  "allListsOnSearch": "It's never easy to say 'No!' when you ask for " +
    "something, but I can't find that list!",
  "allCampaignsOnSearch": "I don't seem to find any campaign by that name. " +
    "Could you double-check for me, please?",
  "allResponsesForInbox": "I'm as curious as you are to see the responses. " +
    "Let's give it some more time!"
};
