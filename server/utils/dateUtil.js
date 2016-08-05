"use strict";

import constants from "../../server/utils/constants";

/**
 * Method to generate all dates between given dates with 1 day interval
 * @param  {Date} startDate
 * @param  {Date} endDate
 * @return {[Date]} list of Date
 * @author Syed Sulaiman M
 */
const generateDatesWithOneDayInterval = (startDate, endDate) => {
  var start = startDate,
      end = endDate,
      currentDate = new Date(start.getTime()),
      generatedDates = [];

  while (currentDate <= end) {
      generatedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + constants.ONE);
  }
  return generatedDates;
};

module.exports = {
  generateDatesWithOneDayInterval: generateDatesWithOneDayInterval
};
