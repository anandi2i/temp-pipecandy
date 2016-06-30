const NO_EMAILS_FOUND = new Error();
NO_EMAILS_FOUND.status = 404;
NO_EMAILS_FOUND.message = "No Emails Found";

const LIST_NOT_FOUND = new Error();
LIST_NOT_FOUND.status = 404;
LIST_NOT_FOUND.message = "List Not Found";

const PERSON_NOT_FOUND = new Error();
PERSON_NOT_FOUND.status = 404;
PERSON_NOT_FOUND.message = "Person Not Found";

const FIELD_VALUES_NOT_FOUND = new Error();
FIELD_VALUES_NOT_FOUND.status = 404;
FIELD_VALUES_NOT_FOUND.message = "Field Values Not Found";

const INVALID_CAMPAIGN_ID = new Error();
INVALID_CAMPAIGN_ID.status = 400;
INVALID_CAMPAIGN_ID.message = "Invalide Campaign Id";

const INVALID_START = new Error();
INVALID_START.status = 400;
INVALID_START.message = "Invalide Start Param";

const INVALID_LIMIT = new Error();
INVALID_LIMIT.status = 400;
INVALID_LIMIT.message = "Invalide Limit Param";

const FIELD_VALUE_CONFLICT = new Error();
FIELD_VALUE_CONFLICT.status = 409;
FIELD_VALUE_CONFLICT.message = "Field Value Already Exists";

const SERVER_ERROR = new Error();
SERVER_ERROR.status = 500;
SERVER_ERROR.message = "Server Error";

const errorMessage = {
  "NO_EMAILS_FOUND": NO_EMAILS_FOUND,
  "INVALID_CAMPAIGN_ID": INVALID_CAMPAIGN_ID,
  "INVALID_START": INVALID_START,
  "INVALID_LIMIT": INVALID_LIMIT,
  "LIST_NOT_FOUND": LIST_NOT_FOUND,
  "PERSON_NOT_FOUND": PERSON_NOT_FOUND,
  "FIELD_VALUES_NOT_FOUND": FIELD_VALUES_NOT_FOUND,
  "FIELD_VALUE_CONFLICT": FIELD_VALUE_CONFLICT,
  "SERVER_ERROR": SERVER_ERROR
};

module.exports = {
  errorMessage: errorMessage
};
