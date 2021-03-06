import {EventEmitter} from "events";
import _ from "underscore";
import moment from "moment";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import {HandleError} from "../utils/ErrorMessageHandler";
import {SuccessMessages} from "../utils/UserAlerts";
import CampaignApi from "../API/CampaignApi";
import EmailListApi from "../API/EmailListApi";
import {browserHistory} from "react-router";

let _error = "";
let _emailList = [];
let campaignData = {};
let allCampaigns = [];
let _allEmailTemplates = [];
let _allUserTemplates = [];
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
let inboxClassificationCount;

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

  emitClassificationCountChange() {
    this.emit("emitClassificationCount");
  },

  addCountChangeListener(callback) {
    this.on("emitClassificationCount", callback);
  },

  removeCountChangeListener(callback) {
    this.removeListener("emitClassificationCount", callback);
  },

  /**
   * Return inbox classification count
   * @return {object} inboxClassificationCount
   */
  getResponseCount() {
    return inboxClassificationCount;
  },

  getError() {
    return _error;
  },

  /**
   * Get the campaign data
   * @return {object} campaignData
   */
  getCampaignData() {
    return campaignData;
  },

  /**
   * @see server/utils/status-codes.js
   * @return {array} allCampaignList
   */
  getAllCampaigns() {
    const edit = ["0"];
    const sent = ["96", "100"];
    const stopped = ["62", "70", "72", "74", "76", "78", "80", "82",
      "84", "90"];
    const progress = ["60"];
    const resume = ["63", "71", "73", "75", "77", "79", "81", "83",
     "85", "91"];
    let allCampaignList = [];
    allCampaigns.map(campaign => {
      const statusCode = campaign.statusCode.toString();
      let status;
      if(_.contains(edit, statusCode)) {
        status = "In Draft";
      } else if (_.contains(sent, statusCode)) {
        status = "Sent";
      } else if (_.contains(stopped, statusCode)) {
        status = "Paused";
      } else if (_.contains(progress, statusCode)) {
        status = "In Progress";
      } else if (_.contains(resume, statusCode)) {
        status = "Resumed";
      } else {
        status = "Scheduled";
      }
      allCampaignList.push({
        id: campaign.campaignId,
        name: campaign.campaign,
        listSentTo: campaign.listSentTo,
        status: status,
        replies: campaign.replies,
        action: status,
        scheduledAt: campaign.scheduledAt ? moment(campaign.scheduledAt)
        .format("DD MMM YYYY, h:mm a") : "-",
        failedCount: campaign.failedCount
      });
    });
    return allCampaignList;
  },

  getAllEmailTemplates() {
    return _allEmailTemplates;
  },

  /**
   * To store all user created Templates
   */
  getAllUserTemplates() {
    return _allUserTemplates;
  },

  getSelectedEmailList() {
    return selectedEmailList;
  },
  /**
   * To store all the email list for the current campaign
   */
  getCampaignEmailList() {
    return _emailList;
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

/*
 * Change class of exisiting smart tags from content if smart tag
   is not present in common smart tags
 * @param  {string} contentText
 * @param  {object} commonSmartTags
 * @return {string} contentText
*/
  parseContent(content, commonSmartTags) {
    let html = $("<div/>").html(content);
    $(html).find("span.tag").each(function(){
      $(this).removeClass("common un-common");
      if(commonSmartTags.includes($(this).attr("data-tag"))){
        $(this).addClass("common");
      } else {
        $(this).addClass("un-common");
      }
    });
    return html.html();
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
      getUsedTagIds.push(parseInt($(val).attr("data-id")));
    });
    let uniqUsedTagIds = _.sortBy(_.uniq(getUsedTagIds));
    getUsedTagIds = uniqUsedTagIds.join().replace(/,/g, "|");
    return {
      usedTagIds: getUsedTagIds,
      usedTagIdsArr: uniqUsedTagIds
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
  },
  /**
   * Get the used smart tags
   * @param  {string} emailContent
   * @return {object} usedTags
   */
  getAllUsedTags(emailContent) {
    const htmlDom = $.parseHTML(emailContent);
    let allUsedTags = [];
    $(htmlDom).find(".tag").each(function(){
      allUsedTags.push({
        id: $(this).attr("data-id"),
        field: $(this).attr("data-tag-name")
      });
    });
    return allUsedTags;
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
    case Constants.GET_ALL_USER_TEMPLATES:
      CampaignApi.getAllUserTemplates().then((response) => {
        _allUserTemplates = response.data;
        _error = "";
        CampaignStore.emitChange();
      }, (err) => {
        _allUserTemplates = [];
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
        let allFieldNames = [];
        let allFieldIds = [];
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
            let fieldName = [];
            let personFields = [];
            let newField = [];
            let newtag = {};
            // To get duplicate Email Ids
            if(_.contains(allEmailList, person.email)) {
              duplicateEmailList.push(person.email);
              // If duplicate email Id then modifiy existing person
              const existingPerson = _.find(allPeopleList, (people) => {
                return people.email === person.email;
              });
              const fieldsList = _.indexBy(getFields, "id");
              _.each(person.fieldValues, field => {
                // add new fields to existing person if exists
                if(!_.contains(existingPerson.fieldNames,
                  fieldsList[field.fieldId].name)){
                  fieldName.push(fieldsList[field.fieldId].name);
                  newtag = {
                    "field": fieldsList[field.fieldId].name,
                    "value": field.value,
                    "id": field.fieldId
                  };
                  personFields.push(newtag);
                  newField.push(_.omit(newtag, "value"));
                } else {
                  // Check for updated values for duplicate fields
                  const existingField = _.findWhere(existingPerson.fieldValues,
                    {fieldId : field.fieldId});
                  if(existingField &&
                    existingField.updatedAt < field.updatedAt) {
                      existingField.value = field.value;
                      const existingPersonField =
                      _.findWhere(existingPerson.personFields,
                        {id : field.fieldId});
                      if(existingPersonField){
                          existingPersonField.value = field.value;
                      }
                  }
                }
              });
              // Add new tags to the existing array
              const existingTags = _.findWhere(allFieldNames,
                {id : person.email});
              existingTags.value = existingTags.value.concat(fieldName);
              // Add new fieldIds to existing field IDs
              const existingFieldId = _.findWhere(allFieldIds,
                {id : person.email});
              existingFieldId.value = existingFieldId.value.concat(newField);
              // Add new Fields to existing person
              existingPerson.personFields =
              _.union(existingPerson.personFields, personFields);
              existingPerson.fieldNames =
              _.union(existingPerson.fieldNames, fieldName);
            } else {
              allEmailList.push(person.email);
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
              const personFieldName = {
                id : person.email,
                value : fieldName
              };
              const personFieldId = {
                id : person.email,
                value : newField
              };
              allFieldNames.push(personFieldName);
              allFieldIds.push(personFieldId);
              person.personFields = personFields;
              person.fieldNames = fieldName;
              allPeopleList.push(person);
            }
          });
        });
        // Put all field name arrays in smartTags array
        _.each(allFieldNames, (field) => {
          smartTags.push(field.value);
        });
        // Put all fieldIds arrays to field ID Array
        _.each(allFieldIds, (fieldId) => {
          fieldIds.push(fieldId.value);
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
    case Constants.GET_CAMPAIGN:
      CampaignApi.getCampaign(action.campaignId).then((response) => {
        campaignData = response.data;
        campaignData.followups.map(followup => followup.id = guid());
        CampaignStore.emitChange();
        if(response.data) {
          browserHistory.push(`/campaign/${action.campaignId}/run`);
        } else {
          browserHistory.push("/campaign");
        }
      }, (err) => {
        browserHistory.push("/campaign");
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
        _error = "";
        browserHistory.push("/campaign");
        displaySuccess(SuccessMessages.successCampaign);
      }, (err) => {
          _error = HandleError.evaluateError(err);
          CampaignStore.emitChange();
      });
      break;
    case Constants.SAVE_USER_TEMPLATE:
      CampaignApi.saveUserTemplate(action.templateData)
      .then((response) => {
        _allUserTemplates.unshift(response.data);
        _error = "";
        displaySuccess("Template saved successfully");
        CampaignStore.emitChange();
      }, (err) => {
          _error = HandleError.evaluateError(err);
          CampaignStore.emitChange();
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
    case Constants.INBOX_CLASSIFICATION_COUNT:
      CampaignApi.getInboxClassificationCount(action.campaignId)
      .then((response) => {
        inboxClassificationCount = response.data;
        CampaignStore.emitClassificationCountChange();
      }, (err) => {
        _error = HandleError.evaluateError(err);
        CampaignStore.emitClassificationCountChange();
        _error = "";
      });
      break;
    case Constants.SEND_TEST_MAIL:
      CampaignApi.sendTestMail(action.data).then((response) => {
        displayError(SuccessMessages.TestMail);
      }, (err) => {
        _error = HandleError.evaluateError(err);
        CampaignStore.emitChange();
        _error = "";
      });
      break;
    case Constants.CREATE_NEW_RUN:
      CampaignApi.createNewRun(action.campaignId).then((response) => {
        browserHistory.push(`campaign/${response.data.id}/run`);
      }, (err) => {
        _error = HandleError.evaluateError(err);
        CampaignStore.emitChange();
        _error = "";
      });
      break;
    case Constants.GET_CAMPAIGN_LISTS:
      CampaignApi.getListForCampaign(action.campaignId).then((response) => {
        _emailList = response.data;
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
