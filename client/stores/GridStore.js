import _ from "underscore";
import {EventEmitter} from "events";

let maxPage;
let _selectedEmailListIds = [];

/**
 * Store to handle grid data and logics
 */
const GridStore = _.extend({}, EventEmitter.prototype, {
  // Store selected email list ids
  saveSelectedEmailListIds(listIds) {
    _selectedEmailListIds = listIds;
  },

  // Return selected email list ids
  getSelectedEmailListIds() {
    return _selectedEmailListIds;
  },

  // Remove selected email list ids
  removeSelectedEmailListIds() {
    _selectedEmailListIds = [];
  },

  /**
   * Calculate the maximum page count based on filtered results
   * @param {number} resultsCount
   * @property {number} defaultLengthPerPage
   */
  setMaxPage(resultsCount) {
    const defaultLengthPerPage = 7;
    const reminderPage = 1;
    maxPage = Math.floor(resultsCount / defaultLengthPerPage);
    if(resultsCount % defaultLengthPerPage) {
      maxPage += reminderPage;
    }
  },

  /**
   * Reset max page count to null
   */
  resetMaxPage() {
    maxPage = null;
  },

  /**
   * @return {number} maxPage
   */
  getMaxPage() {
    return maxPage;
  }
});

export default GridStore;
