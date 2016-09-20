const ZERO = 0;
const ONE = 1;
const TWO = 2;
const THREE = 3;
const FOUR = 4;
const FIVE = 5;
const SEVEN = 7;
const TWENTY = 20;
const EIGHT = 8;

const constants = {
  "ttsInterval": 3,
  "EMPTYOBJECT" : "10",
  "EMPTYARRAY" : 0,
  "EMPTYARRAYINDEX" : -1,
  "STATUS_NOT_SUPPORTED" : "Status Not Supported while Sending",
  "PERSON_UNSUBSCRIBED" : "Person Unsubscribed Current User",
  "USER_STOPPED_CAMPAIGN" : "User has Stopped the Campaign",
  "USER": "USER",
  "SYSTEM": "SYSTEM",
  "ONE": ONE,
  "ZERO": ZERO,
  "SEVEN": SEVEN,
  "EIGHT": EIGHT,
  "TWENTY": TWENTY,
  "MINUS_ONE": -1,
  "MINUS_TEN": -10,
  "TIME_FORMAT": "dd/mm/yyyy HH:MM:ss.l",
  "CLASSIFICATIONS" : ["bounced", "out-of-office", "actionable",
    "nurture", "negative"],
  "LIST_DEFAULT_FIELDS": [ONE, TWO, THREE, FOUR, FIVE]
};

//export default constants;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = constants;
