import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import {HandleError} from "../utils/ErrorMessageHandler";
import CampaignApi from "../API/CampaignApi";
import EmailListApi from "../API/EmailListApi";
import appHistory from "../RouteContainer";

let _error = "";
let _getAllCampaigns = {};
let _allEmailTemplates = [];
let selectedEmailList = {};
let allPeopleList = [];
let duplicateEmailList = [];

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
  },

  getIssuesPeopleList(issueTags) {
    let peopleList = _.filter(allPeopleList, (person, key) => {
      let fieldName = [];
      if(person.firstName) fieldName.push("firstName");
      if(person.middleName) fieldName.push("middleName");
      if(person.lastName) fieldName.push("lastName");
      if(person.salutation) fieldName.push("salutation");
      if(person.email) fieldName.push("email");
      return !(issueTags.length === _.intersection(issueTags,
        fieldName.concat(_.pluck(person.fields, "name"))).length);
    });
    return peopleList;
  },

  setOptText(optionalText) {
    let optAddress = "", optText = "";
    if(optionalText.isAddress){
      optAddress = optionalText.address;
    }
    if(optionalText.isOptText){
      optText = optionalText.optText;
    }
    let style = "width: 100%;border-top: 1px solid #c2c2c2;" +
      "padding-top: 20px;margin-top: 20px;";
    return ("<div style='" + style + "'>" +
      "<table><tr style='color:#c2c2c2;'>" +
      "<td style='width: 50%;float: left;padding: 0;'>" +
      optAddress + "</td>" +
      "<td style='width:50%;text-align:right;padding: 0;'><a>" +
      optText + "</a></td></tr></table></div>");
  },

  // re-construct tag name to smart-tags
  constructEmailTemplate(str) {
    let html = $.parseHTML(str);
    let findCommonTags = $(html).find("span.common");
    _.each(findCommonTags, function(val, key){
      let getTag = $(val).data("tag");
      $(val)[0].dataset.tagName = getTag;
      $(val).html("&lt;"+getTag+"&gt;");
    });
    let steDom = $("<div/>").html(html);
    return $(steDom).html();
  },

  applySmartTagsValue(emailContent, getPersonInfo) {
    emailContent = emailContent.replace(/"/g, "'");
    $.each(getPersonInfo, function (key, value) {
      if(key === "fields") {
        _.each(value, function (val, key) {
          let fieldsStr = "<span class='tag un-common' "+
            "contenteditable='false' data-tag='"+val.name+"' data-tag-name='"+
            val.name+"'>&lt;"+val.name+"&gt;</span>";
          let re = new RegExp(fieldsStr, "g");
          emailContent = emailContent
            .replace(re, val.value);
        });
      }
      let str = "<span class='tag common' "+
        "contenteditable='false' data-tag='"+key+"' data-tag-name='"+
          key+"'>&lt;"+key+"&gt;</span>";
      let re = new RegExp(str, "g");
      emailContent = emailContent.replace(re, value);
    });
    return emailContent;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.CREATE_NEW_CAMPAIGN:
      CampaignApi.createCampaign(action.data).then((response) => {
        _error = "";
        appHistory.push(`campaign/${response.data.id}/run`);
      }, (err) => {
        _error = HandleError.evaluateError(err);
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_ALL_CAMPAIGN:
      CampaignApi.getAllCampaign().then((response) => {
        _getAllCampaigns = response.data;
        _error = "";
        CampaignStore.emitChange();
      }, (err) => {
        _error = HandleError.evaluateError(err);
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
        _error = HandleError.evaluateError(err);
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_SELECTED_EMAIL_LIST:
      let selectedList = {
        list: action.data
      };
      EmailListApi.getSelectedList(selectedList).then((response) => {
        let emailList = [];
        let smartTags = [];
        let commonSmartTags = [];
        let unCommonSmartTags = [];
        allPeopleList = [];
        let allEmailList = [];
        duplicateEmailList = [];
        response.data.forEach(function(list, index) {
          emailList.push({
            id: list.id,
            name: list.name,
            peopleCount: list.people.length
          });
          _.each(list.people, function(person) {
            allPeopleList.push(person);
            // To get duplicate Email Ids
            if(_.contains(allEmailList, person.email)) {
              duplicateEmailList.push(person.email);
            } else {
              allEmailList.push(person.email);
            }
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
          peopleList: allPeopleList
        };
        _error = "";
        CampaignStore.emitEmailListChange();
      }, (err) => {
        selectedEmailList = {};
        _error = HandleError.evaluateError(err);
        CampaignStore.emitEmailListChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default CampaignStore;
