import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import EmailListApi from "../API/EmailListApi";
//@todo: Actions should not be imported here, should remove it asap
import EmailListActions from "../actions/EmailListActions";
import {HandleError} from "../utils/ErrorMessageHandler";
import {SuccessMessages} from "../utils/UserAlerts";
import {browserHistory} from "react-router";

let _allEmailList = {};
let _getEmailList = {};
let _getEmailListByID = {};
let _error = "";
let _success = "";
let _getFields = {};
let _csvListDetails = {};
let _campaignTemplatePreview = {};

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const EmailListStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitPersonUpdate() {
    this.emit("changeUpdates");

  },

  // Emit Change event
  emitChange() {
    this.emit("change");
  },

  // Emit get meta fiels
  emitFields() {
    this.emit("getFields");
  },

  // Add listener for fields
  addFieldsListener(fieldsCB) {
    this.on("getFields", fieldsCB);
  },

  // Remove listener for fields
  removeFieldsListener(fieldsCB) {
    this.removeListener("getFields", fieldsCB);
  },

  // Add change listener
  addChangeListener(callback) {
    this.on("change", callback);
  },

  // Remove change listener
  removeChangeListener(callback) {
    this.removeListener("change", callback);
  },

  // Add change listener for updates
  addPersonChangeListener(callback) {
    this.on("changeUpdates", callback);
  },

  // Remove change listener for updates
  removePersonChangeListener(callback) {
    this.removeListener("changeUpdates", callback);
  },

  // Emit get upload csv list
  emitCsvChange() {
    this.emit("csvList");
  },

  // Add listener for upload csv list
  addCsvListener(csvCB) {
    this.on("csvList", csvCB);
  },

  // Remove listener for upload csv list
  removeCsvListener(csvCB) {
    this.removeListener("csvList", csvCB);
  },
  // Emit to get campaign grid preview template
  emitCampaignGridPreviewChange() {
    this.emit("campaignGridPreview");
  },

  // Add listener for campaign grid preview template
  addCampaignGridPreviewListener(peviewCB) {
    this.on("campaignGridPreview", peviewCB);
  },

  // Remove listener for campaign grid preview template
  removeCampaignGridPreviewListener(peviewCB) {
    this.removeListener("campaignGridPreview", peviewCB);
  },
  // Get upload csv response
  getUploadCsvDetails() {
    return _csvListDetails;
  },

  // Clear upload csv response
  removeUploadCsvDetails() {
    _csvListDetails = "";
  },

  getFieldsFromStore() {
    return _getFields;
  },

  /**
   * @return {Array} All lists created by the current user
   */
  getAllList() {
    return _allEmailList;
  },

  getEmailListByID() {
    let emailListByID = _getEmailList[0];
    let _peopleData = [];
    const fieldsList = _.indexBy(emailListByID.fields, "id");
    const fieldsName = _.pluck(emailListByID.fields, "name");
    _.each(emailListByID.people, function(people, index) {
      let _temp = {
        id: people.id,
        select: people.id,
        firstName: people.firstName,
        middleName: people.middleName || "",
        lastName: people.lastName,
        email: people.email,
        isUnsubscribed: people.isUnsubscribed,
        edit: ""
      };
      _.each(fieldsName, fieldName => {
        _temp[fieldName] = "";
      });
      _.each(people.fieldValues, field => {
        _temp[fieldsList[field.fieldId].name] = field.value;
      });
      _peopleData.push(_temp);
    });
    _getEmailListByID = {
      id: emailListByID.id,
      name: emailListByID.name,
      people: _peopleData,
      fieldsName: fieldsName,
      listFields: emailListByID.fields,
      peopleDetails: emailListByID.people
    };
    return _getEmailListByID;
  },

  getPeopleByListUpdated() {
    return _getEmailListByID;
  },

  getError() {
    return _error;
  },

  getSuccess() {
    return _success;
  },

  // Get campaign template content to preview in campaign grid
  getCampaignTemplatePreview() {
    return _campaignTemplatePreview;
  },

  // Set empty value for template preview in campaign grid
  removeCampaignTemplatePreview() {
    _campaignTemplatePreview = "";
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.ALL_EMAIL_LIST:
      EmailListApi.getAllEmailList().then((response) => {
        _allEmailList = response.data;
        EmailListStore.emitChange();
      }, (err)=> {
        _allEmailList = {};
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.CREATE_NEW_LIST:
      EmailListApi.createList(action.data).then((response) => {
        _allEmailList = {};
        browserHistory.push("/list/"+response.data.id);
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.GET_LIST_BY_ID:
      let data = {"ids":[action.data]};
      _getEmailList = [];
      EmailListApi.getSelectedList(data).then((response) => {
        _getEmailList = response.data;
        EmailListStore.emitChange();
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.GET_LIST_BY_FILTER:
      //let filters = {"data":[action.data]};
      let response = [{
            "firstName": "Special",
            "middleName": "seperated",
            "lastName": "Jai",
            "email": "special@ra.com",
            "fieldValues": []
        }, {
            "firstName": "Yuvaraj",
            "middleName": "change",
            "lastName": "Singh",
            "salutation": "Mr",
            "email": "yuvi@d.com",
            "fieldValues": []
        }, {
            "firstName": "Harbajan",
            "middleName": "",
            "lastName": "Singh",
            "salutation": "Mr",
            "email": "bajji@b.com",
            "fieldValues": []
        }];

      action.data.personList = response;
      console.log("filter before bulk inset---", action);
      /* Call bulk inset api */
      EmailListApi.createMultiplePerson(action.data).then((response) => {
        console.log("response after db hit------", response, _getEmailList);
        console.log("_getEmailList", _getEmailList);
        let personList = response.data.personList, zero = 0;
         //Remove if same email id exists in grid
        if(_getEmailList[0].people.length && personList.length) {
          _.each(personList, function(person) {
            if(_.findIndex(_getEmailList[0].people, {email : person.email})
            >= zero ) {
              _getEmailList[0].people.push(person);
            }
          });
        } else {
          _getEmailList[0].people = personList;
        }
        browserHistory.push("/list/"+response.data.listId);
         _success = SuccessMessages.successSubscribe;
         EmailListStore.emitChange();
         _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.FILE_UPLOAD:
      EmailListApi.uploadFile(action.data).then((response) => {
        _csvListDetails = response.data;
        EmailListStore.emitCsvChange();
        //@todo This has to be removed asap as it calls api inside API
        //100% dirty call
        EmailListActions.getEmailListByID(action.data.listId);
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.SAVE_SINGLE_PERSON:
      EmailListApi.saveSinglePerson(action.data).then((response) => {
        //Remove if same email id exists in grid
        _getEmailList[0].people = _.reject(_getEmailList[0].people,
          person => response.data.email === person.email
        );
        //Push the new recipient
        _getEmailList[0].people.push(response.data);
        _success = SuccessMessages.successSubscribe;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.UPDATE_SINGLE_PERSON:
      EmailListApi.updateSinglePerson(action.data).then((response) => {
        _success = SuccessMessages.successSubscribeUpdate;
        const index = _.findIndex(_getEmailList[0].people,
          {id:response.data.id});
        _getEmailList[0].people[index] = response.data;
        EmailListStore.emitChange();
        EmailListActions.getEmailListByID(action.data.listId);
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.DELETE_PERSONS:
      EmailListApi.deletePersons(action.data).then((response) => {
        _getEmailList[0].people = _.reject(_getEmailList[0].people,
          person => _.contains(action.data.peopleIds, person.id)
        );
        _success = SuccessMessages.successDelete;
        EmailListStore.emitChange();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
      });
      break;
    case Constants.GET_FIELDS:
      EmailListApi.getFields(action.data).then((response) => {
        _getFields = response.data;
        EmailListStore.emitFields();
      }, (err) => {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitFields();
      });
      break;
    case Constants.SAVE_ADDITIONAL_FIELD:
      EmailListApi.saveAdditionalField(action.data).then((response) => {
        _success = SuccessMessages.successAddAdditionalField;
        //_getEmailListByID.listFields.push(response.data);
        //@todo: This dirty call has to be removed asap
        EmailListActions.getEmailListByID(action.data.listId);
        // EmailListStore.emitChange();
        _getFields.listFields.push(response.data);
        EmailListStore.emitFields();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.RELATE_ADDITIONAL_FIELD:
      EmailListApi.relateAdditionalField(action.data).then((response) => {
        _success = SuccessMessages.successAddAdditionalField;
        //@todo: This dirty call has to be removed asap
        EmailListActions.getEmailListByID(action.data.id);
        _getFields.listFields.push(response.data);
        EmailListStore.emitFields();
        _success = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitChange();
        _error = "";
      });
      break;
    case Constants.GET_CAMPAIGN_PREVIEW_TEMPLATE:
      EmailListApi.getCampaignPreviewTemplate(action.id).then((response) => {
        _campaignTemplatePreview = response.data;
        EmailListStore.emitCampaignGridPreviewChange();
        _campaignTemplatePreview = "";
      }, (err)=> {
        _error = HandleError.evaluateError(err);
        EmailListStore.emitCampaignGridPreviewChange();
        _error = "";
      });
      break;
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
