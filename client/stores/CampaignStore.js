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
    let initialRange = 1;
    let endRange = 10;
    let _allCampaignListFlattenData = [];
    _.each(_getAllCampaigns, (obj, index) => {
      let randomVal = _.random(initialRange, endRange);
      _allCampaignListFlattenData.push({
        id: obj.id,
        name: obj.name || "",
        listSentTo: _.random(initialRange, endRange),
        campaignStatus: obj.campaignStatus || "cStatus",
        campaignReplies: _.random(initialRange, endRange),
        campaignProgressDone: _.random(initialRange, randomVal),
        campaignProgressTotal: randomVal,
        campaignProgress: obj.campaignProgress || "cProgress",
        campaignAction: obj.campaignAction || "cAction",
        campaignRun: obj.campaignRun || "cRun"
      });
    });
    return _allCampaignListFlattenData;
  },

  getAllEmailTemplates() {
    return _allEmailTemplates;
  },

  getSelectedEmailList() {
    return selectedEmailList;
  },

  getIssuesPeopleList(issueTags) {
    let issuePeopleList = [];
    _.each(allPeopleList, (person, key) => {
      let getTags = _.intersection(person.fieldNames, issueTags);
      if(getTags.length !== issueTags.length)
        issuePeopleList.push(person);
    });
    return issuePeopleList;
  },

  constructSmartTags(allTags) {
    let getAllTags = [];
    allTags.commonSmartTags.map((tag, key) => {
      getAllTags.push({name: tag, className: "common"});
    });
    allTags.unCommonSmartTags.map((tag, key) => {
      getAllTags.push({name: tag, className: "un-common"});
    });
    return getAllTags;
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
    _.each(findCommonTags, (val, key) => {
      let getTag = $(val).data("tag");
      $(val)[0].dataset.tagName = getTag;
      $(val).html("&lt;"+getTag+"&gt;");
    });
    let steDom = $("<div/>").html(html);
    return $(steDom).html();
  },

  replaceSmartTagContent(value) {
    let tag = "<span class='tag common' data-id='"+value.id+"' "+
      "contenteditable='false' data-tag='"+value.field+
      "' data-tag-name='"+value.value+"'>"+value.value+"</span>";
    return tag;
  },

  applyTags(emailContent, str, value){
    let reg = new RegExp(str, "g");
    emailContent = emailContent
      .replace(reg, CampaignStore.replaceSmartTagContent(value));
    return emailContent;
  },

  applySmartTagsValue(emailContent, getPersonInfo) {
    emailContent = emailContent.replace(/\"/g, "\'");
    _.each(getPersonInfo.personFields, (value, key) => {
      let common = "<span class='tag common' "+
        "contenteditable='false' data-tag='"+value.field+"' data-tag-name='"+
          value.field+"'>&lt;"+value.field+"&gt;</span>";
      if(emailContent.includes(common)){
        emailContent = CampaignStore.applyTags(emailContent, common, value);
      } else {
        let unCommon = "<span class='tag un-common' "+
          "contenteditable='false' data-tag='"+value.field+"' data-tag-name='"+
          value.field+"'>&lt;"+value.field+"&gt;</span>";
        if(emailContent.includes(unCommon)){
          emailContent = CampaignStore.applyTags(emailContent, unCommon, value);
        }
      }
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
        ids: action.data
      };
      EmailListApi.getSelectedList(selectedList).then((response) => {
        let emailList = [];
        let smartTags = [];
        let commonSmartTags = [];
        let unCommonSmartTags = [];
        let allFields = [];
        allPeopleList = [];
        let allEmailList = [];
        duplicateEmailList = [];
        response.data.forEach((list, index) => {
          emailList.push({
            id: list.id,
            name: list.name,
            peopleCount: list.people.length
          });
          let getFields = list.fields;
          _.each(list.people, (person) => {
            // To get duplicate Email Ids
            if(_.contains(allEmailList, person.email)) {
              duplicateEmailList.push(person.email);
            } else {
              allEmailList.push(person.email);
            }
            let fieldName = [];
            let personFields = [];
            if(person.firstName) {
              fieldName.push("firstName");
              personFields.push({
                "field": "firstName",
                "value": person.firstName,
                "id": 1
              });
            }
            if(person.middleName) {
              fieldName.push("middleName");
              personFields.push({
                "field": "middleName",
                "value": person.middleName,
                "id": 2
              });
            }
            if(person.lastName) {
              fieldName.push("lastName");
              personFields.push({
                "field": "lastName",
                "value": person.lastName,
                "id": 3
              });
            }
            if(person.email) {
              fieldName.push("email");
              personFields.push({
                "field": "email",
                "value": person.email,
                "id": 4
              });
            }
            if(person.salutation) {
              fieldName.push("salutation");
              personFields.push({
                "field": "salutation",
                "value": person.salutation,
                "id": 5
              });
            }
            const fieldsList = _.indexBy(getFields, "id");
            _.each(person.fieldValues, field => {
              fieldName.push(fieldsList[field.fieldId].name);
              personFields.push(
                {
                  "field": fieldsList[field.fieldId].name,
                  "value": field.value,
                  "id": field.fieldId
                }
              );
            });
            smartTags.push(fieldName);
            person.personFields = personFields;
            person.fieldNames = fieldName;
            allPeopleList.push(person);
          });
        });
        //http://stackoverflow.com/questions/16229479/how-to-perform-union-or-intersection-on-an-array-of-arrays-with-underscore-js
        commonSmartTags = _.intersection.apply(_, smartTags);
        smartTags = _.union.apply(_, smartTags);
        allFields = smartTags;
        unCommonSmartTags = _.difference(smartTags, commonSmartTags);
        selectedEmailList = {
          emailList: emailList,
          commonSmartTags: commonSmartTags,
          unCommonSmartTags: unCommonSmartTags,
          peopleList: allPeopleList,
          allFields: allFields
        };
        _error = "";
        CampaignStore.emitEmailListChange();
      }, (err) => {
        selectedEmailList = {};
        _error = HandleError.evaluateError(err);
        CampaignStore.emitEmailListChange();
      });
      break;
    case Constants.GET_ALL_INBOX_REPORT:
      //TODO need to change API
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
    default:
      return true;
  }
  return true;
});

export default CampaignStore;
