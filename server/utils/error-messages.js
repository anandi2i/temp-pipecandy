const NO_EMAILS_FOUND = {
  code: 404,
  message: "No Emails Found"
};

const INVALID_CAMPAIGN_ID = {
  code: 400,
  message: "Invalide Campaign Id"
};

const INVALID_START = {
  code: 400,
  message: "Invalide Start Param"
};

const INVALID_LIMIT = {
  code: 400,
  message: "Invalide Limit Param"
};

const errorMessage = {
  "NO_EMAILS_FOUND": NO_EMAILS_FOUND,
  "INVALID_CAMPAIGN_ID": INVALID_CAMPAIGN_ID,
  "INVALID_START": INVALID_START,
  "INVALID_LIMIT": INVALID_LIMIT
};

module.exports = {
  errorMessage: errorMessage
};
