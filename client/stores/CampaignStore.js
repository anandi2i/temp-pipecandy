import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import CampaignApi from "../API/CampaignApi";
import EmailListApi from "../API/EmailListApi";
import appHistory from "../RouteContainer";

let _error = "";
let _getAllCampaigns = {};
let _allEmailTemplates = [];
let selectedEmailList = {};

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const CampaignStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitChange() {
    this.emit("change");
  },

  // Add change listener
  addChangeListener(callback) {
    this.on("change", callback);
  },

  // Remove change listener
  removeChangeListener(callback) {
    this.removeListener("change", callback);
  },

  // Emit Change event
  emitEmailListChange() {
    this.emit("emailListChange");
  },

  // Add change listener
  addEmailListChangeListener(callback) {
    this.on("emailListChange", callback);
  },

  // Remove change listener
  removeEmailListChangeListener(callback) {
    this.removeListener("emailListChange", callback);
  },

  getError() {
    return _error;
  },

  getAllCampaigns() {
    return _getAllCampaigns;
  },

  getAllEmailTemplates() {
    return _allEmailTemplates;
  },

  getSelectedEmailList() {
    return selectedEmailList;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.CREATE_NEW_CAMPAIGN:
      CampaignApi.createCampaign(action.data).then((response) => {
        _error = "";
        appHistory.push("campaign/run");
      }, (err) => {
        _error = err;
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_ALL_CAMPAIGN:
      CampaignApi.getAllCampaign().then((response) => {
        _getAllCampaigns = response.data;
        _error = "";
        CampaignStore.emitChange();
      }, (err) => {
        _error = err;
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_ALL_EMAIL_TEMPLATES:
      CampaignApi.getAllEmailTemplates().then((response) => {
        _allEmailTemplates = response.data;
        _error = "";
        CampaignStore.emitChange();
      }, (err) => {
        _allEmailTemplates = [];
        _error = err;
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_SELECTED_EMAIL_LIST:
      EmailListApi.getSelectedList(action.data).then((response) => {
        let emailList = [];
        let smartTags = [];
        let commonSmartTags = [];
        let unCommonSmartTags = [];
        response.data.forEach(function(list, index) {
          emailList.push({
            name: list.name,
            peopleCount: list.people.length
          });
          _.each(list.people, function(person) {
            let fieldName = [];
            if(person.firstName) fieldName.push("firstName");
            if(person.middleName) fieldName.push("middleName");
            if(person.lastName) fieldName.push("lastName");
            if(person.salutation) fieldName.push("salutation");
            if(person.email) fieldName.push("email");
            smartTags.push(fieldName.concat(_.pluck(person.fields, "name")));
          });
        });
        //http://stackoverflow.com/questions/16229479/how-to-perform-union-or-intersection-on-an-array-of-arrays-with-underscore-js
        commonSmartTags = _.intersection.apply(_, smartTags);
        smartTags = _.union.apply(_, smartTags);
        unCommonSmartTags = _.difference(smartTags, commonSmartTags);
        selectedEmailList = {
          emailList: emailList,
          commonSmartTags: commonSmartTags,
          unCommonSmartTags: unCommonSmartTags,
        };
        _error = "";
        CampaignStore.emitEmailListChange();
      }, (err) => {
        selectedEmailList = {};
        _error = err;
        CampaignStore.emitEmailListChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default CampaignStore;
