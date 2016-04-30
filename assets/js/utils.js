/**
 * utils.js
 * @description All the utility methods for the app goes here
 */

"use strict";

/**
 * Generate a random id
 * @see http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 * @constructor
 * @author dinesh.r@ideas2it.com
 */
function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

/**
 * Get the cookie value
 * @see http://www.w3schools.com/js/js_cookies.asp
 * @param {string} cname - cookie name
 * @return {string} cookie value
 * @author dinesh.r@ideas2it.com
 */
function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
