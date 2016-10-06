import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

// Define action methods
const EmailListActions = {
  getAllEmailList() {
    AppDispatcher.handleAction({
      actionType: Constants.ALL_EMAIL_LIST
    });
  },
  createNewList(list) {
    AppDispatcher.handleAction({
      actionType: Constants.CREATE_NEW_LIST,
      data: list
    });
  },
  getEmailListByID(id){
    AppDispatcher.handleAction({
      actionType: Constants.GET_LIST_BY_ID,
      data: id
    });
  },
  getEmailListByFilter(filter) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_LIST_BY_FILTER,
      data: filter
    });
  },
  uploadFile(data){
    AppDispatcher.handleAction({
      actionType: Constants.FILE_UPLOAD,
      data: data
    });
  },
  saveSinglePerson(data){
    AppDispatcher.handleAction({
      actionType: Constants.SAVE_SINGLE_PERSON,
      data: data
    });
  },
  updateSinglePerson(data){
    AppDispatcher.handleAction({
      actionType: Constants.UPDATE_SINGLE_PERSON,
      data: data
    });
  },
  /**
   * Delete list of persons from the emial list
   *
   * @param  {Object} data - Contains list of persons to delete and list of persons emaillist id
   */
  deletePersons(data){
    AppDispatcher.handleAction({
      actionType: Constants.DELETE_PERSONS,
      data: data
    });
  },
  getFields(data) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_FIELDS,
      data: data
    });
  },
  saveAdditionalField(data) {
    AppDispatcher.handleAction({
      actionType: Constants.SAVE_ADDITIONAL_FIELD,
      data: data
    });
  },
  /**
   * Action to relate exisitng meta field to the list
   * @param {Object} data Meta id and list id
   * @emits {Constants.RELATE_ADDITIONAL_FIELD}
   */
  relateAdditionalField(data) {
    AppDispatcher.handleAction({
      actionType: Constants.RELATE_ADDITIONAL_FIELD,
      data: data
    });
  },
  /**
   * Action to get campaign templates to display in campaign grid
   * @param {number} id - campaign id
   * @emits {Constants.GET_CAMPAIGN_PREVIEW_TEMPLATE}
   */
  getCampaignPreviewTemplate(id) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_CAMPAIGN_PREVIEW_TEMPLATE,
      id: id
    });
  }
};

export default EmailListActions;
