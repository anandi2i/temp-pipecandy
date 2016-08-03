import keyMirror from "keymirror";

// Define action constants
export default keyMirror({
  ALL_EMAIL_LIST: null,
  CREATE_NEW_LIST: null,
  GET_LIST_BY_ID: null,
  LOGIN: null,
  LOGOUT: null,
  SET_USER_DETAIL: null,
  USER_UPDATE: null,
  FORGOT_PASSSWORD: null,
  RESET_PASSSWORD: null,
  CREATE_NEW_CAMPAIGN: null,
  GET_ALL_CAMPAIGN: null,
  FILE_UPLOAD: null,
  SAVE_SINGLE_PERSON: null,
  GET_ALL_EMAIL_TEMPLATES: null,
  GET_SELECTED_EMAIL_LIST: null,
  UPDATE_SINGLE_PERSON: null,
  DELETE_PERSONS: null,
  GET_FIELDS: null,
  SAVE_ADDITIONAL_FIELD: null,
  RELATE_ADDITIONAL_FIELD: null,
  GET_INBOX_MAILS: null,
  CHECK_EXISTING_CAMPAIGN:  null,
  GET_RECENT_CAMPAIGN_METRICS:  null,
  GET_CURRENT_CAMPAIGN_METRICS:  null,
  SAVE_CAMPAIGN_TEMPLATES:  null,
  CHECK_SPAM: null,
  GET_RECENT_CAMPAIGN_DETAILS: null,
  GET_CURRENT_CAMPAIGN_DETAILS: null,
  CHECK_WORDIO_VARIATIONS: null,
  GET_OTHER_STATS_METRICS: null,
  GET_IS_EXISTING_CAMPAIGN: null,
  GET_SCHEDULED_EMAILS: null,
  GET_SENT_EMAILS: null,
  GET_EMAIL_THREAD: null,
  MOVE_INBOX_MAILS: null,
  GET_CAMPAIGN_PREVIEW_TEMPLATE: null,
  REMOVE_PEOPLE_QUEUE: null,
  UNSUBSCRIBE_CAMPAIGN: null,
  PAUSE_CAMPAIGN: null,
  RESUME_CAMPAIGN: null
});
