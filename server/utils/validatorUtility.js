"use strict";

import moment from "moment-timezone";
import logger from "../../server/log";

/**
 * validates the person time zone from CSV
 *
 * @param  {String} timeZone
 * @author Ramanavel Selvaraju
 */
const validateTimeZone = (timeZone) => {
  if(!timeZone) return false;
  if(timeZone.trim() === "") return false;
  try {
    return moment.tz.zone(timeZone) ? true : false;
  } catch (e) {
    logger.error({error: e, stack: e.stack, input: {timeZone}});
    return false;
  }
};

/**
 * Method to check if the given email is valid or not
 * @param  {[email]} email
 * @param  {[function]} validateEmailCB
 * @return {[boolean]}
 * @author Aswin Raj A
 */
const validateEmail = (email, validateEmailCB) => {
  const reg = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,15}$/;
  if (reg.test(email)){
    validateEmailCB(true);
  } else {
    validateEmailCB(false);
  }
};

/**
 * To strip out all the special characters and numbers in a given string
 * @param  {[string]} string
 * @return {[strippedString]}
 * @author Aswin Raj A
 */
const validateString = (string) => {
  return string.replace(/[^a-zA-Z ]/g, "").trim();
};


/**
 * To strip out all the special characters and numbers in a given string
 * @param  {[string]} string
 * @return {[strippedString]}
 * @author Aswin Raj A
 */
const validateStringWithNumber = (string) => {
  return string.replace(/[^a-zA-Z0-9 ]/g, "").trim();
};

module.exports = {
  validateEmail: validateEmail,
  validateString: validateString,
  validateStringWithNumber: validateStringWithNumber,
  validateTimeZone: validateTimeZone
};
