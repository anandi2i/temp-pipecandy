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
  email = email ? email : "";
  const reg = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,15}$/;
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
  string = string ? string : "";
  return string.replace(/[^a-zA-Z ]/g, "").trim();
};


/**
 * To strip out all the special characters and numbers in a given string
 * @param  {[string]} string
 * @return {[strippedString]}
 * @author Aswin Raj A
 */
const validateStringWithNumber = (string) => {
  string = string ? string : "";
  return string.replace(/[^a-zA-Z0-9 ]/g, "").trim();
};

/**
 * Validates name string and return if valid or not based on
 * following conditions
 * 1) Is the first character not a number
 * 2) Does the string not contain special characters
 * @param  {[string]} string
 * @return {[boolean true or false]}
 * @author Naveen Kumar
 */
const validateFieldName = (string) => {
  string = string ? string : "";
  if(string.length) {
    let stringCheck = string[0].replace(/[0-9 ]/g, "").trim();
    if(!stringCheck.length) {
      return false;
    }
    stringCheck = string.replace(/[^a-zA-Z0-9 ]/g, "");
    if(string.length !== stringCheck.length) {
      return false;
    }
    return true;
  }
  return true;
};

module.exports = {
  validateEmail: validateEmail,
  validateString: validateString,
  validateStringWithNumber: validateStringWithNumber,
  validateFieldName: validateFieldName,
  validateTimeZone: validateTimeZone
};
