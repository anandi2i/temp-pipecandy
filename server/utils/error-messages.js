const NO_EMAILS_FOUND = new Error();
NO_EMAILS_FOUND.status = 404;
NO_EMAILS_FOUND.name = "NO_EMAILS_FOUND";
NO_EMAILS_FOUND.message = "No Emails Found";

const LIST_NOT_FOUND = new Error();
LIST_NOT_FOUND.status = 404;
LIST_NOT_FOUND.name = "LIST_NOT_FOUND";
LIST_NOT_FOUND.message = "List Not Found";

const PERSON_NOT_FOUND = new Error();
PERSON_NOT_FOUND.status = 404;
PERSON_NOT_FOUND.name = "PERSON_NOT_FOUND";
PERSON_NOT_FOUND.message = "Person Not Found";

const FIELD_VALUES_NOT_FOUND = new Error();
FIELD_VALUES_NOT_FOUND.status = 404;
FIELD_VALUES_NOT_FOUND.name = "FIELD_VALUES_NOT_FOUND";
FIELD_VALUES_NOT_FOUND.message = "Field Values Not Found";

const INVALID_CAMPAIGN_ID = new Error();
INVALID_CAMPAIGN_ID.status = 400;
INVALID_CAMPAIGN_ID.name = "INVALID_CAMPAIGN_ID";
INVALID_CAMPAIGN_ID.message = "Invalid Campaign Id";

const INVALID_START = new Error();
INVALID_START.status = 400;
INVALID_START.name = "INVALID_START";
INVALID_START.message = "Invalid Start Param";

const INVALID_LIMIT = new Error();
INVALID_LIMIT.status = 400;
INVALID_LIMIT.name = "INVALID_LIMIT";
INVALID_LIMIT.message = "Invalid Limit Param";

const FIELD_VALUE_CONFLICT = new Error();
FIELD_VALUE_CONFLICT.status = 409;
FIELD_VALUE_CONFLICT.name = "FIELD_VALUE_CONFLICT";
FIELD_VALUE_CONFLICT.message = "Field Value Already Exists";

const SERVER_ERROR = new Error();
SERVER_ERROR.status = 500;
SERVER_ERROR.name = "SERVER_ERROR";
SERVER_ERROR.message = "Internal Server Error";

const CAMPAIGN_NOT_FOUND = new Error();
CAMPAIGN_NOT_FOUND.status = 404;
CAMPAIGN_NOT_FOUND.name = "CAMPAIGN_NOT_FOUND";
CAMPAIGN_NOT_FOUND.message = "Campaign Not Found";

const TEMAPLTE_NOT_FOUND = new Error();
TEMAPLTE_NOT_FOUND.status = 404;
TEMAPLTE_NOT_FOUND.name = "CAMPAIGN_TEMPLATE_NOT_FOUND";
TEMAPLTE_NOT_FOUND.message = "Campaign Templates Not Found";

const INVALID_INBOX_MAIL_ID = new Error();
INVALID_INBOX_MAIL_ID.status = 400;
INVALID_INBOX_MAIL_ID.name = "INVALID_INBOX_MAIL_ID";
INVALID_INBOX_MAIL_ID.message = "Invalid Inbox Mail Id";

const INVALID_CLASSIFICATION = new Error();
INVALID_CLASSIFICATION.status = 400;
INVALID_CLASSIFICATION.name = "INVALID_CLASSIFICATION";
INVALID_CLASSIFICATION.message = "Invalid Classification";

const LIST_EXISTS = new Error();
LIST_EXISTS.status = 400;
LIST_EXISTS.name = "LIST_EXISTS";
LIST_EXISTS.message = "List name already exists";

const CAMPAIGN_EXISTS = new Error();
CAMPAIGN_EXISTS.status = 400;
CAMPAIGN_EXISTS.name = "CAMPAIGN_EXISTS";
CAMPAIGN_EXISTS.message = "List name already exists";

const INVALID_LIST_ID = new Error();
INVALID_LIST_ID.status = 400;
INVALID_LIST_ID.name = "INVALID_LIST_ID";
INVALID_LIST_ID.message = "Invalid List Id";

const INVALID_FIELD_ID = new Error();
INVALID_FIELD_ID.status = 400;
INVALID_FIELD_ID.name = "INVALID_FIELD_ID";
INVALID_FIELD_ID.message = "Invalid Field Id";

const INVALID_FIELD_NAME = new Error();
INVALID_FIELD_NAME.status = 400;
INVALID_FIELD_NAME.name = "INVALID_FIELD_NAME";
INVALID_FIELD_NAME.message = "Invalid Field Name";

const PERSON_EXISTS_IN_LIST = new Error();
PERSON_EXISTS_IN_LIST.status = 400;
PERSON_EXISTS_IN_LIST.name = "PERSON_EXISTS_IN_LIST";
PERSON_EXISTS_IN_LIST.message = "Person already exists in the list";

const errorMessage = {
  NO_EMAILS_FOUND: NO_EMAILS_FOUND,
  INVALID_CAMPAIGN_ID: INVALID_CAMPAIGN_ID,
  INVALID_START: INVALID_START,
  INVALID_LIMIT: INVALID_LIMIT,
  LIST_NOT_FOUND: LIST_NOT_FOUND,
  PERSON_NOT_FOUND: PERSON_NOT_FOUND,
  FIELD_VALUES_NOT_FOUND: FIELD_VALUES_NOT_FOUND,
  FIELD_VALUE_CONFLICT: FIELD_VALUE_CONFLICT,
  SERVER_ERROR: SERVER_ERROR,
  CAMPAIGN_NOT_FOUND: CAMPAIGN_NOT_FOUND,
  TEMAPLTE_NOT_FOUND: TEMAPLTE_NOT_FOUND,
  INVALID_INBOX_MAIL_ID: INVALID_INBOX_MAIL_ID,
  INVALID_CLASSIFICATION: INVALID_CLASSIFICATION,
  LIST_EXISTS: LIST_EXISTS,
  CAMPAIGN_EXISTS: CAMPAIGN_EXISTS,
  INVALID_LIST_ID: INVALID_LIST_ID,
  INVALID_FIELD_ID: INVALID_FIELD_ID,
  INVALID_FIELD_NAME: INVALID_FIELD_NAME,
  PERSON_EXISTS_IN_LIST: PERSON_EXISTS_IN_LIST
};

module.exports = {
  errorMessage: errorMessage
};
