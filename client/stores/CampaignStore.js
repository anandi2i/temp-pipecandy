import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import {HandleError} from "../utils/ErrorMessageHandler";
import CampaignApi from "../API/CampaignApi";
import EmailListApi from "../API/EmailListApi";
import {browserHistory} from "react-router";

let _error = "";
let _isExistCampaignId = false;
let allCampaigns = [];
let _allEmailTemplates = [];
let _campaignMetrics = [];
let _campaignDetails = {};
let _WordIoVariations = "";
let selectedEmailList = {};
let allPeopleList = [];
let duplicateEmailList = [];
let fieldIds = [];
let inboxMails = [];
let scheduledMails = [];
let sentMails = [];
let spamScore;

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

  // Emit reportStoreChange event
  reportStoreChange() {
    this.emit("reportStoreChange");
  },

  // Add reportStoreChange listener
  addReportStoreListener(callback) {
    this.on("reportStoreChange", callback);
  },

  // Remove reportStoreChange listener
  removeReportStoreListener(callback) {
    this.removeListener("reportStoreChange", callback);
  },

  // Emit performanceStoreChange event
  performanceStoreChange() {
    this.emit("performanceStoreChange");
  },

  // Add performanceStoreChange listener
  addPerformanceStoreListener(callback) {
    this.on("performanceStoreChange", callback);
  },

  // Remove performanceStoreChange listener
  removePerformanceStoreListener(callback) {
    this.removeListener("performanceStoreChange", callback);
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

  /**
   * @emit spam score change event
   */
  emitSpamScoreChange() {
    this.emit("spamScoreChange");
  },

  /**
   * Listen spam score change event
   * @param {function} callback
   */
  addSpamScoreChangeListener(callback) {
    this.on("spamScoreChange", callback);
  },

  /**
   * remove spam score change listened event
   * @param {function} callback
   */
  removeSpamScoreChangeListener(callback) {
    this.removeListener("spamScoreChange", callback);
  },

  // Emit Change event
  emitMailboxChange() {
    this.emit("MailboxChange");
  },

  // Add change listener
  addMailboxChangeListener(callback) {
    this.on("MailboxChange", callback);
  },

  // Remove change listener
  removeMailboxChangeListener(callback) {
    this.removeListener("MailboxChange", callback);
  },

  //Emitter for moving mails
  emitMoveMailsChange() {
    this.emit("MoveMails");
  },

  //Add move mails listener
  addMoveMailsChangeListener(callback) {
    this.on("MoveMails", callback);
  },

  //Remove move mails listener
  removeMoveMailsChangeListener(callback) {
    this.removeListener("MoveMails", callback);
  },

  getError() {
    return _error;
  },

  /**
   * Check existing campaign id
   * @return {boolean} true or false
   */
  isExistCampaign() {
    return _isExistCampaignId;
  },

  getAllCampaigns() {
    const edit = ["0"];
    const pause = ["8", "9", "10", "49", "50", "60", "63", "71", "73", "75",
      "77", "79", "81", "83", "85"];
    const resume = ["62", "70", "72", "74", "76", "78", "80", "82", "84"];
    let allCampaignList = [];
    allCampaigns.map(campaign => {
      const statusCode = campaign.statusCode.toString();
      let status;
      if(_.contains(edit, statusCode)) {
        status = "In Draft";
      } else if (_.contains(pause, statusCode)) {
        status = "Scheduled";
      } else if (_.contains(resume, statusCode)) {
        status = "Paused";
      } else {
        status = "Sent";
      }
      allCampaignList.push({
        id: campaign.campaignId,
        name: campaign.campaign,
        listSentTo: campaign.listSentTo,
        status: status,
        replies: campaign.replies,
        progress: `${campaign.progress}%`,
        action: status
      });
    });
    return allCampaignList;
  },

  getAllEmailTemplates() {
    return _allEmailTemplates;
  },

  getSelectedEmailList() {
    return selectedEmailList;
  },

  getCampaignMetrics() {
    return _campaignMetrics;
  },

  getCampaignDetails(){
    return _campaignDetails;
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
    fieldIds = _.union.apply(_, fieldIds);
    fieldIds = _.uniq(fieldIds, "id");
    allTags.commonSmartTags.map((tag, key) => {
      let getId = _.where(fieldIds, {
        field: tag
      });
      getAllTags.push({
        name: tag,
        className: "common",
        id: getId[0].id
      });
    });
    allTags.unCommonSmartTags.map((tag, key) => {
      let getId = _.where(fieldIds, {
        field: tag
      });
      getAllTags.push({
        name: tag,
        className: "un-common",
        id: getId[0].id
      });
    });
    return getAllTags;
  },

  setOptText(optionalText) {
    let optAddress = "", optText = "";
    if(optionalText.isAddress) {
      optAddress = optionalText.address;
    }
    if(optionalText.isOptText) {
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
  constructEmailTemplate(contentText) {
    let html = $.parseHTML(contentText);
    let findCommonTags = $(html).find("span.common");
    _.each(findCommonTags, (val, key) => {
      let getTag = $(val).data("tag");
      $(val)[0].dataset.tagName = getTag;
      $(val).html("&lt;" + getTag + "&gt;");
    });
    let steDom = $("<div/>").html(html);
    return $(steDom).html();
  },

/**
 * Find additional field ID's from given string
 * @param  {string} contentText
 * @return {object} (join array of tag ID's using | symbole and array of tag ID's)
 */
  usedTagIds(contentText){
    let htmlDom = $.parseHTML(contentText);
    let getUsedTagIds = [];
    _.each($(htmlDom).find("span.tag"), function(val, key){
      getUsedTagIds.push($(val).attr("data-id"));
    });
    getUsedTagIds = _.sortBy(_.uniq(getUsedTagIds));
    return {
      usedTagIds: getUsedTagIds.join().replace(/,/g, "|"),
      usedTagIdsArr: getUsedTagIds
    };
  },

  replaceSmartTagContent(value) {
    let tag = "<span class='tag common' data-tag='" + value.field + "' " +
      "contenteditable='false' data-id='" + value.id +
      "' data-tag-name='" + value.value + "'>" + value.value + "</span>";
    return tag;
  },

  applyTags(emailContent, tagContent, value){
    let reg = new RegExp(tagContent, "g");
    emailContent = emailContent
      .replace(reg, CampaignStore.replaceSmartTagContent(value));
    return emailContent;
  },

  applySmartTagsValue(emailContent, getPersonInfo) {
    emailContent = emailContent.replace(/\"/g, "\'");
    _.each(getPersonInfo.personFields, (value, key) => {
      let common = "<span class='tag common' " +
        "contenteditable='false' data-tag='" + value.field + "' data-id='" +
         value.id + "' data-tag-name='" + value.field + "'>&lt;" +
          value.field + "&gt;</span>";
      if (emailContent.includes(common)) {
        emailContent = CampaignStore.applyTags(emailContent, common, value);
      } else {
        let unCommon = "<span class='tag un-common' " +
          "contenteditable='false' data-tag='" + value.field + "' data-id='" +
          value.id + "' data-tag-name='" + value.field +
          "'>&lt;" + value.field + "&gt;</span>";
        if (emailContent.includes(unCommon)) {
          emailContent = CampaignStore.applyTags(emailContent, unCommon, value);
        }
      }
    });
    return emailContent;
  },
  /**
   * @return {number} spamScore
   */
  getSpamScore() {
    return spamScore;
  },

  checkWordIoVariations() {
    return _WordIoVariations;
  },

  /**
   * @return {object} scheduledMails
   */
  getScheduledMails() {
    return scheduledMails;
  },
  /**
   * @return {object} inboxMails
   */
  getInboxMails() {
    return inboxMails;
  },
  /**
   * @return {object} inboxMails
   */
  getSentMails() {
    return sentMails;
  }
});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.CREATE_NEW_CAMPAIGN:
      CampaignApi.createCampaign(action.data).then((response) => {
        _error = "";
        browserHistory.push(`campaign/${response.data.id}/run`);
      }, (err) => {
        _error = HandleError.evaluateError(err);
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_ALL_CAMPAIGN:
      CampaignApi.getAllCampaign().then((response) => {
        allCampaigns = response.data;
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
        fieldIds = [];
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
            let newField = [];
            let newtag = {};
            if(person.firstName) {
              fieldName.push("First Name");
              newtag = {
                "field": "First Name",
                "value": person.firstName,
                "id": 1
              };
              personFields.push(newtag);
              newField.push(_.omit(newtag, "value"));
            }
            if(person.middleName) {
              fieldName.push("Middle Name");
              newtag = {
                "field": "Middle Name",
                "value": person.middleName,
                "id": 2
              };
              personFields.push(newtag);
              newField.push(_.omit(newtag, "value"));
            }
            if(person.lastName) {
              fieldName.push("Last Name");
              newtag = {
                "field": "Last Name",
                "value": person.lastName,
                "id": 3
              };
              personFields.push(newtag);
              newField.push(_.omit(newtag, "value"));
            }
            if(person.email) {
              fieldName.push("Email");
              newtag = {
                "field": "Email",
                "value": person.email,
                "id": 4
              };
              personFields.push(newtag);
              newField.push(_.omit(newtag, "value"));
            }
            if(person.salutation) {
              fieldName.push("Salutation");
              newtag = {
                "field": "Salutation",
                "value": person.salutation,
                "id": 5
              };
              personFields.push(newtag);
              newField.push(_.omit(newtag, "value"));
            }
            const fieldsList = _.indexBy(getFields, "id");
            _.each(person.fieldValues, field => {
              fieldName.push(fieldsList[field.fieldId].name);
              newtag = {
                "field": fieldsList[field.fieldId].name,
                "value": field.value,
                "id": field.fieldId
              };
              personFields.push(newtag);
              newField.push(_.omit(newtag, "value"));
            });
            smartTags.push(fieldName);
            fieldIds.push(newField);
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
    case Constants.GET_INBOX_MAILS:
      CampaignApi.getInboxMails(action.data).then((response) => {
        inboxMails = response.data;
        _error = "";
        CampaignStore.emitMailboxChange();
      }, (err) => {
        inboxMails = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.emitMailboxChange();
      });
      break;
    case Constants.GET_SCHEDULED_EMAILS:
      CampaignApi.getScheduledMails(action.data).then((response) => {
        scheduledMails = response.data;
        _error = "";
        CampaignStore.emitMailboxChange();
      }, (err) => {
        scheduledMails = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.emitMailboxChange();
      });
      break;
    case Constants.GET_SENT_EMAILS:
      CampaignApi.getSentMails(action.data).then((response) => {
        sentMails = response.data;
        _error = "";
        CampaignStore.emitMailboxChange();
      }, (err) => {
        sentMails = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.emitMailboxChange();
      });
      break;
    case Constants.CHECK_EXISTING_CAMPAIGN:
      CampaignApi.getCampaign(action.campaignId).then((response) => {
        _isExistCampaignId = response.data.exists;
        CampaignStore.emitChange();
        if (response.data.exists) {
          browserHistory.push(`/campaign/${action.campaignId}/run`);
        } else {
          browserHistory.push("/campaign");
        }
      }, (err) => {
        browserHistory.push("/campaign");
      });
      break;
    case Constants.GET_RECENT_CAMPAIGN_METRICS:
      CampaignApi.getRecentCampaignMetrics().then((response) => {
        _campaignMetrics = response.data.recentCampaignMetrics;
        _error = "";
        CampaignStore.performanceStoreChange();
      }, (err) => {
        _campaignMetrics = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.performanceStoreChange();
      });
      break;
    case Constants.GET_CURRENT_CAMPAIGN_METRICS:
      CampaignApi.getCurrentCampaignMetrics(action.campaignId)
      .then((response) => {
        _campaignMetrics = response.data.currentCampaignMetrics;
        _error = "";
        CampaignStore.performanceStoreChange();
      }, (err) => {
        _campaignMetrics = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.performanceStoreChange();
      });
      break;
    case Constants.SAVE_CAMPAIGN_TEMPLATES:
      //TODO need to clean
      CampaignApi.saveCampaignTemplates(action.campaign)
      .then((response) => {
        browserHistory.push("/campaign");
        displaySuccess("Campaign saved successfully");
      }, (err) => {
        console.log(err);
        displayError("Problem in saving");
      });
      break;
    case Constants.CHECK_SPAM:
      CampaignApi.checkSpam(action.data).then(response => {
        spamScore = response.data[0].spamResult.evaluation;
        CampaignStore.emitSpamScoreChange();
      }, err => {
        spamScore = 0;
        _error = HandleError.evaluateError(err);
        CampaignStore.emitSpamScoreChange();
      });
      break;
    case Constants.GET_RECENT_CAMPAIGN_DETAILS:
      CampaignApi.getRecentCampaignDetails()
      .then((response) => {
        _campaignDetails = response.data.recentCampaignDetails;
        _error = "";
        CampaignStore.reportStoreChange();
      }, (err) => {
        _campaignDetails = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.reportStoreChange();
      });
      break;
    case Constants.GET_CURRENT_CAMPAIGN_DETAILS:
      CampaignApi.getCurrentCampaignDetails(action.campaignId)
      .then((response) => {
        _campaignDetails = response.data.currentCampaignDetails;
        _error = "";
        CampaignStore.reportStoreChange();
      }, (err) => {
        _campaignDetails = [];
        _error = HandleError.evaluateError(err);
        CampaignStore.reportStoreChange();
      });
      break;
    case Constants.CHECK_WORDIO_VARIATIONS:
      CampaignApi.getWordIoVariations(action.content)
      .then((response) => {
        _WordIoVariations = response.data.text;
        _error = "";
        CampaignStore.emitChange();
      }, (err) => {
        _WordIoVariations = {};
        displayError("Sorry, something went wrong");
      });
      break;
    case Constants.MOVE_INBOX_MAILS:
      CampaignApi.moveMails(action.data).then((response) => {
        CampaignStore.emitMoveMailsChange();
      }, (err) => {
        _error = err;
        CampaignStore.emitMoveMailsChange();
      });
      break;
    case Constants.REMOVE_PEOPLE_QUEUE:
      CampaignApi.removePeopleQueue(action.peopleIds).then((response) => {
        CampaignStore.emitMoveMailsChange();
      }, (err) => {
        _error = err;
        CampaignStore.emitMoveMailsChange();
      });
      break;
    case Constants.PAUSE_CAMPAIGN:
      CampaignApi.pauseCampaign(action.campaignId).then((response) => {
        const targetCamp = _.findWhere(allCampaigns, {
          campaignId: response.data.id
        });
        targetCamp.statusCode = response.data.statusCode;
        CampaignStore.emitChange();
      }, (err) => {
        _error = HandleError.evaluateError(err);
        CampaignStore.emitChange();
      });
      break;
    case Constants.RESUME_CAMPAIGN:
      CampaignApi.resumeCampaign(action.campaignId).then((response) => {
        const targetCamp = _.findWhere(allCampaigns, {
          campaignId: response.data.id
        });
        targetCamp.statusCode = response.data.statusCode;
        CampaignStore.emitChange();
      }, (err) => {
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
