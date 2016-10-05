import React from "react";
import ReactDOM from "react-dom";
import update from "react-addons-update";
import _ from "underscore";
import moment from "moment";
import AddFollowups from "./AddFollowups.react";
import CampaignIssuesPreviewPopup from "./CampaignIssuesPreviewPopup.react";
import WordaiPreviewPopup from "./WordaiPreviewPopup.react";
import PreviewMailsPopup from "./PreviewMailsPopup.react";
import TestMail from "./TestMail.react";
import CampaignStore from "../../stores/CampaignStore";
import GridStore from "../../stores/GridStore";
import UserStore from "../../stores/UserStore";
import UserAction from "../../actions/UserAction";
import CampaignActions from "../../actions/CampaignActions";
import {ErrorMessages, SuccessMessages} from "../../utils/UserAlerts";
import Spinner from "../Spinner.react";
import AlertModal from "../AlertModal.react";
import {Link} from "react-router";
import SaveTemplate from "./SaveTemplate.react";

class ScheduleEmail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: true,
      followups: [],
      followupsMaxLen: 8,
      displayScheduleCampaign: false,
      emailList: [],
      commonSmartTags: [],
      unCommonSmartTags: [],
      emailContent: "",
      emailSubject: "",
      errorCount: 0,
      contentIssueTags: [],
      subjectIssueTags: [],
      personIssues: [],
      emailText: "",
      mainEmailContent: {},
      followupsEmailContent: [],
      allFields: [],
      emailRawText: "",
      subjectRawText: "",
      user: "",
      optText: "",
      address: "",
      isOptText: true,
      isAddress: true,
      spamRating: "",
      isSpinner: true,
      improveDelivery: true,
      isPreview: false,
      alertMsg: "",
      successBtn: "",
      cancelBtn: "",
      isWeekendFollowUpDisabled: true
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    const selectedEmailListIds = GridStore.getSelectedEmailListIds();
    CampaignStore.addEmailListChangeListener(this.onStoreChange);
    CampaignStore.addSpamScoreChangeListener(this.onSpamScoreChange);
    CampaignActions.getSelectedEmailList(selectedEmailListIds);
    this.el.find("select").material_select();
    this.el.find(".tooltipped").tooltip({delay: 50});
    initDatePicker(this.el.find(".datepicker"));
    initTimePicker(this.el.find(".timepicker"));
  }

 /*
  * Create folloup objects and save with campaign subject and content
 */
  componentWillUnmount() {
    let followups = [];
    this.state.followups.map(followup => {
      let followupObj = this.refs[`addFollowups${followup.id}`];
      const el = followupObj.el;
      let followupDetails = {
        daysAfter:
        el.find(`#dayPicker${followupObj.props.followupId} input`).val()
          .split(" ")[0],
        stepNo: followupObj.props.followUpNumber,
        time: this.convertMeridian(el.find(".timepicker").val()),
        id: followupObj.props.followupId,
        content: followupObj.state.emailContent
      };
      followups.push(followupDetails);
    });
    const {optText, address, user} = this.state;
    if(user.optText !== optText || user.address !== address){
      this.props.setOptTextAndAdress(optText, address);
    }
    this.props.setTemplate(
      tinymce.get("emailContent").getContent(),
      tinymce.get("emailSubject").getContent(),
      followups
    );
    this.el.find("select").material_select("destroy");
    this.clearTinyMCE();
    CampaignStore.removeEmailListChangeListener(this.onStoreChange);
    CampaignStore.removeSpamScoreChangeListener(this.onSpamScoreChange);
    this.el.find(".tooltipped").tooltip("remove");
  }

 /*
  * Remove editor from tinyMCE
 */
 clearTinyMCE() {
   if(tinymce.get("emailSubject")) {
     tinyMCE.execCommand("mceRemoveEditor", true, "emailSubject");
   }
   if(tinymce.get("optOutAddress")) {
     tinyMCE.execCommand("mceRemoveEditor", true, "optOutAddress");
   }
   if(tinymce.get("emailContent")) {
     tinyMCE.execCommand("mceRemoveEditor", true, "emailContent");
   }
 }

/**
 * Call init tinyMCE editor
 *
 * @param  {object} allTags - It contains collection of unique smart-tags based on selected list
 */
  initTinyMceEditors = () => {
    this.clearTinyMCE();
    let {getAllTags, address, commonSmartTags} = this.state;
    let {selectedTemplate, subject, selectedTemplateFollowups} = this.props;
     selectedTemplate =
     CampaignStore.parseContent(selectedTemplate, commonSmartTags);
     subject = CampaignStore.parseContent(subject, commonSmartTags);
    initTinyMCE("#optOutAddress", "", "", "", false, this.tinyMceAddressCb,
      address);
    initTinyMCE("#emailSubject", "", "", getAllTags, false, this.tinyMceSubCb,
      subject);
    initTinyMCE("#emailContent", "#mytoolbar", "#dropdown", getAllTags, true,
      this.tinyMceCb, selectedTemplate);
    if(selectedTemplate){
      this.setState({
        emailContent: selectedTemplate,
        subject: subject,
        followups: selectedTemplateFollowups || []
      });
    }
  }

  tinyMceCb = (editor) => {
    let content = editor.getContent();
    let issueTags = getIssueTagsInEditor(content);
    this.setState({
      emailContent: content,
      contentIssueTags: issueTags,
      emailRawText: editor.getBody().textContent
    }, () => {
      let errorCount = this.getErrorCount();
      this.setState({
        errorCount: errorCount,
        editorErrorCount: errorCount
      });
    });
  }

  tinyMceSubCb = (editor) => {
    let content = editor.getContent();
    let issueTags = getIssueTagsInEditor(content);
    this.setState({
      emailSubject: content,
      subjectIssueTags: issueTags,
      subjectRawText: editor.getBody().textContent
    }, () => {
      let errorCount = this.getErrorCount();
      this.setState({
        errorCount: errorCount,
        editorErrorCount: errorCount
      });
    });
  }

  tinyMceAddressCb = (editor) => {
    const content = editor.getContent();
    this.setState({
      address: content
    });
  }

  getErrorCount(){
    return parseInt(this.state.subjectIssueTags.length, 10) +
      parseInt(this.state.contentIssueTags.length, 10);
  }

/**
 * Set state object during store change and construct common and
 * uncommon smart tags to insert into the editor
 */
  onStoreChange = () => {
    let selectedEmailList = CampaignStore.getSelectedEmailList();
    let user = UserStore.getUser();
    const {optText, address} = this.props;
    this.setState({
      emailList: selectedEmailList.emailList || [],
      commonSmartTags: selectedEmailList.commonSmartTags || [],
      unCommonSmartTags: selectedEmailList.unCommonSmartTags || [],
      getAllPeopleList: selectedEmailList.peopleList || [],
      allFields: selectedEmailList.allFields || [],
      user: user,
      optText: optText || user.optText,
      address: address || user.address,
      isSpinner: false
    }, () => {
      let allTags = {
        commonSmartTags: this.state.commonSmartTags,
        unCommonSmartTags: this.state.unCommonSmartTags
      };
      this.setState({
        getAllTags: CampaignStore.constructSmartTags(allTags)
      }, () => {
        this.initTinyMceEditors();
      });
    });
  }

  /**
   * Update the spamscore on spam score change
   */
  onSpamScoreChange = () => {
    const spamScore = CampaignStore.getSpamScore();
    const safe = 3;
    const danger = 5;
    const timeout = 5000; //5 seconds
    let spamRating = "CAREFUL";
    if(spamScore < safe) {
      spamRating = "SAFE";
    } else if(spamScore > danger) {
      spamRating = "DANGER";
    }
    this.setState({
      spamRating: spamRating
    });
    setTimeout($.proxy(function() {
      this.setState({
        spamRating: ""
      });
    }, this), timeout);
  }

  toggleEditContainer = () => {
    this.setState({
      clicked: !this.state.clicked
    }, () => {
      this.el.find("#mainTemplate").slideToggle("slow");
      if(!this.state.clicked) {
        this.setState({
          emailText: this.state.emailRawText
        });
      } else {
        this.setState({
          emailText: ""
        });
      }
    });
  }

  addFollowups = () => {
    let {followups, followupsMaxLen} = this.state;
    if(followups.length < followupsMaxLen) {
      this.setState({
        followups: followups.concat({
          id: guid(),
          content: "",
        })
      });
    }
  }

  toggleSetState (field) {
    if(field) {
      let state = {};
      state[field] = !this.state[field];
      this.setState(state);
    }
  }

  //http://stackoverflow.com/questions/29527385/react-removing-element-from-array-in-component-state
  deleteFollowUp = (key) => {
    let howMany = 1;
    this.setState({
      followups: update(this.state.followups, {$splice: [[key, howMany]]})
    });
  }

  onChange(e, field) {
    let state = {};
    state[field] = e.target.value;
    this.setState(state);
  }

  getPersonIssues() {
    let emailContent = tinymce.get("emailContent").getContent();
    let emailIssueTags = getIssueTagsInEditor(emailContent);
    let emailSubject = tinymce.get("emailSubject").getContent();
    let subjectIssueTags = getIssueTagsInEditor(emailSubject);
    let issueTags = _.union(emailIssueTags, subjectIssueTags);
    return CampaignStore.getIssuesPeopleList(issueTags);
  }

  openPreviewModal(preview) {
    if(preview === "issues") {
      if(this.state.emailList.length){
        this.setState({
          personIssues: this.getPersonIssues()
        }, () => {
          this.refs.issues.openModal();
        });
      } else {
        displayError(ErrorMessages.EmptyEmailList);
      }
    } else {
      // Check if all missing tags are fixed
      if(this.checkEmailContentError()) {
        let followups = [];
        let mainTemplate = this.refs.issues.state.previewIssuesCompleted;
        this.state.followups.map( (val, key) => {
          let followup = this.refs[`addFollowups${val.id}`];
          followups.push({
            emailContent: followup.state.emailContent,
            issueCompleted: followup.refs.issues.state.previewIssuesCompleted
          });
        }, this);
        this.setState({
          previewFollowups: followups,
          previewMainTemplate: mainTemplate,
          isPreview: true
        }, () => {
          this.refs.preview.openModal();
        });
      }
    }
  }

  closePreviewCallback = () => {
    this.setState({
      isPreview: false
    });
  }

 /**
  * Check if all mandatory fields are filled
  * @return {boolean}
  */
  checkEmailContentError() {
    const {
      emailRawText,
      subjectRawText,
      isOptText,
      optText,
      isAddress
    } = this.state;
    let address, isValid = false;
    if(this.state.emailList.length){
      if(subjectRawText.replace(/\u200B/g, "")) {
        if(emailRawText.replace(/\u200B/g, "")) {
          if((isOptText && optText) || !isOptText) {
            address = tinyMCE.get("optOutAddress").getBody().textContent;
            if((isAddress && address) || !isAddress) {
              if(!this.state.errorCount) {
                //Check if all mandatory fields are filled in followups
                isValid = this.checkFollowupsFields();
              } else {
                displayError(ErrorMessages.SmartTagIssuesInMainEmail);
              }
            } else {
              displayError(ErrorMessages.EmptyOptAddress);
            }
          } else {
            displayError(ErrorMessages.EmptyOptText);
          }
        } else {
          displayError(ErrorMessages.EmptyEmailContent);
        }
      } else {
        displayError(ErrorMessages.EMPTY_SUBJECT);
      }
    } else {
      displayError(ErrorMessages.EmptyEmailList);
    }
    return isValid;
  }

  /**
   * Check if all mandatory fields are filled in followups
   * @return {boolean}
   */
  checkFollowupsFields() {
    let followupsIssueTags = [], emptyFollowup = [], initCount = 1;
    let isValid = false;
    this.state.followups.map((val, key) => {
      const content = this.refs[`addFollowups${val.id}`].refs.issues;
      const isContent =
        tinyMCE.get(`emailContent${val.id}`).getBody()
        .textContent.trim().replace(/\u200B/g, "");
      if(content.props.personIssues.length){
        followupsIssueTags.push(key + initCount);
      }
      if(!isContent){
        emptyFollowup.push(key + initCount);
      }
    }, this);
    if(!emptyFollowup.length){
      if(!followupsIssueTags.length){
        isValid = true;
      } else {
        displayError(ErrorMessages.SmartTagIssuesInFollowup +
          followupsIssueTags.join() + ".");
      }
    } else {
      displayError(ErrorMessages.EmptyFollowupEmailContent +
      emptyFollowup.join() + ".");
    }
    return isValid;
  }

  saveCampaignInfo = () => {
    if(this.state.user.optText !== this.state.optText ||
      this.state.user.address !== this.state.address){
        let formData = {
          "id": this.state.user.id,
          "optText": this.state.optText,
          "address": this.state.address
        };
        UserAction.userUpdate(formData);
    }
    // Check if all missing tags are fixed
    if(this.checkEmailContentError()) {
      let mainEmailContent = {};
      if(!this.state.editorErrorCount){
        let campaignTemplates = [];
        let template = {};
        template.subject = this.state.emailSubject;
        template.content = this.state.emailContent;
        template.usedTagIds = CampaignStore
          .usedTagIds(template.subject.concat(template.content)).usedTagIds;
        template.userId = getCookie("userId");
        campaignTemplates.push(template);
        mainEmailContent = {
          listIds: _.pluck(this.state.emailList, "id"),
          campaign: this.campaignDetails(),
          campaignTemplates: campaignTemplates
        };
      } else {
        let mainTemplate = this.refs.issues.state;
        mainEmailContent = this.constructTemplateObjects(mainTemplate,
          "mainEmail");
      }
      // Get followups details
      mainEmailContent.followUps = this.followupsDetails();
      this.setState((state) => ({
        mainEmailContent: mainEmailContent
      }), () => {
        CampaignActions.saveCampaignTemplates({
          id: this.props.campaignId,
          templates: this.state.mainEmailContent
        });
      });
    }
  }

/**
 * Construct followups object to save
 * @return {object} followup
 */
  followupsDetails() {
    let followups = [];
    this.state.followups.map(function(val, key) {
      let followup = this.refs[`addFollowups${val.id}`];
      if(!followup.state.editorErrorCount){
        let template = {};
        // Set email subject &nbsp; to save followup subjects.
        template.subject = " ";
        template.content = followup.state.emailContent;
        template.usedTagIds = CampaignStore.usedTagIds(
          template.content).usedTagIds;
        template.userId = getCookie("userId");
        followups.push({
          followUp: this.followupCampaignDetails(followup),
          campaignTemplates: template
        });
      } else {
        let followupIssue = followup.refs.issues.state;
        let followupObj = this.constructTemplateObjects(followupIssue,
          "followups");
        let campaignDetails = {
          followUp: this.followupCampaignDetails(followup),
          campaignTemplates: followupObj
        };
        followups.push(campaignDetails);
      }
    }, this);
    return followups;
  }

/**
 * Construct followup informations
 * @param  {object} followup - contains AddFollowups properties
 * @return {object} followupCampaignDetails - followup informations
 */
  followupCampaignDetails(followup) {
    const el = followup.el;
    let followupCampaignDetails = {
      daysAfter: el.find(`#dayPicker${followup.props.followupId} input`).val()
        .split(" ")[0],
      stepNo: followup.props.followUpNumber,
      time: this.convertMeridian(el.find(".timepicker").val())
    };
    return followupCampaignDetails;
  }

  /**
   * Convert 12 to 24 hrs format
   * @param  {string} time - 12hrs time format
   * @return {string}      - 24hrs time format
   */
  convertMeridian(time) {
    return moment(time, ["h:mm A"]).format("HH:mm");
  }

/**
 * Construct main email informations
 * @return {object} - main email informations
 */
 campaignDetails() {
  const {isOptText, isAddress, optText, address, displayScheduleCampaign,
    improveDelivery, isWeekendFollowUpDisabled} = this.state;
  const element = this.el;
  let campaignDetails = {
    id: this.props.campaignId,
    isOptTextNeeded: isOptText,
    isAddressNeeded: isAddress,
    optText: optText,
    address: address,
    userDate: new Date().toString(),
    isTTSEnabled: improveDelivery,
    weekendFollowUps: isWeekendFollowUpDisabled
  };
  if(displayScheduleCampaign) {
    //campaignDetails.scheduledDate = element.find(".datepicker").val();
    //campaignDetails.scheduledTime = element.find(".timepicker").val();
    const scheduledAt = new Date(element.find(".datepicker").val() + " "
      + this.convertMeridian(element.find(".timepicker").val()));
    campaignDetails.scheduledAt = scheduledAt.toUTCString();
  }
  return campaignDetails;
}

  /**
   * Construct main template object to save
   * @param  {object} mainTemplate
   * @param  {string} emailType
   * @return {object}              - email template
   */
  constructTemplateObjects(mainTemplate, emailType) {
    const index = 0, removed = 0;
    let listIds = _.pluck(this.state.emailList, "id");
    let template = {};
    let issuesCompletedList = [];
    issuesCompletedList = _.clone(mainTemplate.issuesCompletedList);
    let emailSubject = mainTemplate.emailSubject;
    template.subject = emailSubject || " ";
    template.content = mainTemplate.emailContent;
    template.usedTagIds = mainTemplate.usedTagIds;
    template.userId = getCookie("userId");
    issuesCompletedList.splice(index, removed, template);
    let campaignDetails;
    if(emailType === "mainEmail"){
      campaignDetails = {
        listIds: listIds,
        campaign: this.campaignDetails(),
        campaignTemplates: issuesCompletedList
      };
    } else {
      campaignDetails = issuesCompletedList;
    }
    return campaignDetails;
  }

  closeCallback = () => {
    if(!this.refs.issues.state.personIssues.length){
      this.setState((state) => ({
        errorCount: 0
      }));
    }
  }

  getOptText = () => {
    return ({
      isOptText: this.state.isOptText,
      isAddress: this.state.isAddress,
      optText: this.state.optText,
      address: this.state.address
    });
  }

  /**
   * Delete the clicked list
   * @param {object} e - event
   * @param {number} listId - Id of the list to be removed
   */
  deleteList(e, listId) {
    let filteredEmailList = _.chain(this.state.emailList)
      .reject(list => (list.id === listId))
      .pluck("id")
      .value();
    let followups = [];
    this.state.followups.map(followup => {
      let followupObj = this.refs[`addFollowups${followup.id}`];
      const el = followupObj.el;
      let followupDetails = {
        daysAfter:
        el.find(`#dayPicker${followupObj.props.followupId} input`).val()
          .split(" ")[0],
        stepNo: followupObj.props.followUpNumber,
        time: this.convertMeridian(el.find(".timepicker").val()),
        id: followupObj.props.followupId,
        content: followupObj.state.emailContent
      };
      followups.push(followupDetails);
    });
    this.props.setTemplate(
      tinymce.get("emailContent").getContent() || "",
      tinymce.get("emailSubject").getContent() || "",
      followups || []
    );
    CampaignActions.getSelectedEmailList(filteredEmailList);
    this.props.changeSelectedList(filteredEmailList);
  }

  /**
   * Check the spam rate of the given content
   * Example:
   */
  checkSpam = () => {
    const {subjectRawText, emailRawText} = this.state;
    CampaignActions.checkSpam(
      new Array({
        "subject": subjectRawText,
        "body": emailRawText
      })
    );
  }

  checkWordIo = () => {
    const emailRawText = tinyMCE.get("emailContent")
      .getContent({format : "text"});
    this.refs.wordai.openModal(emailRawText);
  }

  /**
   * Toggle Improve Delivery option
   */
  toggleImproveDelivery = () => {
    if(this.state.improveDelivery) {
      this.setState({
        alertMsg: SuccessMessages.WarningImproveDelivery,
        successBtn: "I understand",
        cancelBtn: "Cancel"
      });
    } else {
      this.setState({
        alertMsg: SuccessMessages.successImproveDelivery,
        successBtn: "Great! Let's do that!",
        cancelBtn: "Cancel"
      });
    }
    this.refs.confirmBox.openModal();
  }

  /**
   * Change Improve Delivery option based on user confirmation
   */
  changeImproveDelivery = (isTrue) => {
    if(isTrue) {
      this.setState({
        improveDelivery: !this.state.improveDelivery
      });
    }
  }

  /**
   * Save Template Name By User.
   * @param {[string]} name template's name
   */
  setTemplateName = (name) => {
    const template = {
      name: name,
      content: this.state.emailContent,
      followUps: []
    };
    this.followupsDetails().map((followup) => {
      template.followUps.push({
        stepNo: followup.followUp.stepNo,
        content: followup.campaignTemplates.content,
        daysAfter: followup.followUp.daysAfter
      });
    });
    CampaignActions.saveUserTemplate(template);
  }

  render() {
    const selectEmailListIndex = 1;
    const draftEmailIndex = 2;
    let {
      errorCount,
      isSpinner,
      followups,
      followupsMaxLen,
      displayScheduleCampaign,
      isOptText,
      optText,
      isAddress,
      clicked,
      emailText,
      emailList,
      emailSubject,
      emailContent,
      personIssues,
      allFields,
      getAllTags,
      getAllPeopleList,
      previewMainTemplate,
      previewFollowups,
      improveDelivery,
      isPreview,
      cancelBtn,
      alertMsg,
      successBtn,
      commonSmartTags,
      emailRawText
    } = this.state;
    let displayAddFollowup =
      (followups.length < followupsMaxLen ? "block" : "none");
    let displaySchedule = displayScheduleCampaign ? "block" : "none";
    let isOptTextDisplay = isOptText ? "block" : "none";
    let isAddressDisplay = isAddress ? "block" : "none";
    let className =
      clicked ? "mdi mdi-chevron-up" : "mdi mdi-chevron-up in-active";
    // TODO hide for Demo
    // const {spamRating, errorCount} = this.state;
    // let spamClass = "spam-result safe";
    // if(spamRating === "DANGER") {
    //   spamClass = "spam-result danger";
    // } else if (spamRating === "CAREFUL") {
    //   spamClass = "spam-result careful";
    // }
    const {isParent, handleClick} = this.props;
    return (
      <div className="container">
        <div className="spinner-container" style={{display: isSpinner ? "block" : "none"}}>
          <Spinner />
        </div>
        <div style={{display: isSpinner ? "none" : "block"}}>
          <div className="row sub-head-container run-campaign-nav-wrapper m-lr-0">
            <div className="head col s12 m8 l8">{"Let's Draft an Email"}</div>
            <div className="col s12 m4 l4 p-0">
              {
                isParent
                  ? <a className="right arrow-btn btn"
                      onClick={() => handleClick(draftEmailIndex)}>
                      Draft Email(s)
                      <i className="mdi mdi-chevron-left left"></i>
                    </a>
                  : <a className="right arrow-btn btn"
                      onClick={() => handleClick(selectEmailListIndex)}>
                      <i className="mdi mdi-chevron-left left"></i>
                      Select Email List(s)
                    </a>
              }
            </div>
            <div className="sub-head">
              <div className="switch">
                <label className="f-s-14">
                  Improve Delivery
                  <input type="checkbox" checked={improveDelivery} onChange={() => this.toggleImproveDelivery()}/>
                  <span className="lever"></span>
                </label>
              </div>
              <a className="btn blue" onClick={() => this.openPreviewModal("preview")}>Preview</a>
              {
                followups.length < followupsMaxLen
                  ?
                    <a className="btn blue" onClick={this.addFollowups}>Add follow up</a>
                  : ""
              }
              <SaveTemplate emailRawText={emailRawText}
                setTemplateName={this.setTemplateName}/>
              <a className="btn blue" onClick={this.saveCampaignInfo}>Send</a>
            </div>
          </div>
          {/* Draft Email starts here*/}
          <div className="row draft-container m-t-50 m-lr-0">
            <div className="head" onClick={this.toggleEditContainer}>
              <div className="col s4 m4 l4"><h3>First Email</h3></div>
              <div className="col s6 m6 l6 editor-text">
                &nbsp;
                {emailText}
              </div>
              <div className="col s2 m2 l2">
                <i className={className}>
                </i>
              </div>
            </div>
            <div id="mainTemplate" className="col s12 m12 l10 offset-l1 draft-template">
                {/* email to list */}
                <div className="row m-lr-0">
                  <div className="col s12 m6 l6 p-lr-0">
                    <input onChange={() => this.toggleSetState("displayScheduleCampaign")}
                      type="checkbox" className="filled-in"
                      id="filled-in-box" defaultChecked="" />
                    <label htmlFor="filled-in-box">Schedule campaign for later</label>
                  </div>
                  <div className="col s12 m6 l6 p-lr-0">
                    <TestMail emailContent={emailContent}
                      emailSubject={emailSubject}
                      errorCount={errorCount}/>
                  </div>
                </div>
                <div className="row m-lr-0 schedule-time" style={{display: displaySchedule}}>
                  <div className="col s12 m4 l3">
                    <label>Deliver on</label>
                    <input type="date" className="datepicker border-input"
                      placeholder="DD Month, year"
                      onChange={(e) => this.onChange(e, "scheduledDate")} />
                  </div>
                  <div className="col s12 m4 l3">
                    <label>At local time</label>
                    <input type="text" placeholder="00:00 AM"
                      className="timepicker border-input"
                      onChange={(e) => this.onChange(e, "scheduledTime")} />
                  </div>
                </div>
                <div className="row email-to m-lr-0">
                  <div className="left-part">
                    To
                  </div>
                  <div className="right-part">
                    {
                      emailList.map(function(list, key) {
                        return (
                          <div key={key} className="chip">
                            <div className="title-wrapper">
                              <Link to={`/list/${list.id}`} target="_blank" className="title">{list.name}</Link>
                            </div>
                            <span className="count">{list.peopleCount}</span>
                            <i onClick={(e) => this.deleteList(e, list.id)}
                              className="mdi mdi-close remove-list"></i>
                          </div>
                        );
                      }, this)
                    }
                  </div>
                  <div className="right-part"
                     style={{display: emailList.length ?
                     "none" : "block"}}>
                     <span className="error-chip" onClick={ () => handleClick(selectEmailListIndex)}>
                       Select your email list
                     </span>
                  </div>
                </div>
                {/* email subject */}
                <div className="row email-subject m-lr-0">
                  <label>{"Email Subject"}</label>
                  <div id="emailSubject" className="email-body inline-tiny-mce" />
                </div>
                {/* TODO Remove this tab for the 1.0 version
                  <div className="row m-lr-0">
                    <ProspectSignals />
                  </div>
                */}
                <div className="row email-content m-lr-0">
                  <div className="tiny-toolbar">
                    <div id="mytoolbar" className="toolbar-head">
                    </div>
                    <label className="align-left tag-info tooltipped f-s-14" data-position="top"
                      data-tooltip="Press '#' to insert smart tags
                      that personalize your email">
                      Press '#' for smart tags
                    </label>
                    {/*<div className="right smart-tag-container">
                        <ul id="dropdown" className="dropdown-content">
                          {
                            commonSmartTags.map(function(tag, key) {
                              return (
                                <li key={key}>
                                  <a className="common" href="javascript:;">{tag}</a>
                                </li>
                              );
                            })
                          }
                          {
                            unCommonSmartTags.map(function(tag, key) {
                              return (
                                <li key={key}>
                                  <a className="un-common" href="javascript:;">{tag}</a>
                                </li>
                              );
                            })
                          }
                        </ul>
                    </div> */}
                  </div>
                  <div id="emailContent" className="email-body inline-tiny-mce" />
                </div>
                {/* Preview button */}
                <div className="row r-btn-container m-lr-0">
                  {/* TODO hide for demo
                    <div className={spamClass}
                    style={{display: spamRating ? "inline-block": "none"}}>
                    SPAM RATING: {spamRating}
                  </div>
                  <div onClick={this.checkSpam} className="btn btn-dflt btn-blue"
                    style={{display: spamRating ? "none": "inline-block"}}>
                    Check Spam
                  </div>
                  <div onClick={this.checkWordIo}
                    className="btn btn-dflt btn-blue" >
                    Check Email Variations
                  </div> */}
                  <div onClick={() => this.openPreviewModal("issues")}
                    style={{display: errorCount ? "inline-block": "none"}}
                    className="btn btn-dflt error-btn" >
                    {errorCount} Issue(s) Found
                  </div>
                </div>
                <div className="row opt-text">
                  <div className="col s12 m-lr-0">
                    <input type="checkbox" className="filled-in" id="optOutText"
                      defaultChecked="checked"
                      onChange={() => this.toggleSetState("isOptText")} />
                    <label htmlFor="optOutText">Opt-Out-Text</label>
                    <div className="input-field" style={{display: isOptTextDisplay}}>
                      <input id="optOutText"
                        type="text"
                        value={optText}
                        className="border-input"
                        onChange={(e) => this.onChange(e, "optText")}
                        name="optOutText" />
                    </div>
                  </div>
                </div>
                <div className="row opt-text">
                  <div className="col s12 m-lr-0">
                    <input type="checkbox" className="filled-in" id="optOutAddrs"
                      defaultChecked="checked"
                      onChange={() => this.toggleSetState("isAddress")} />
                    <label htmlFor="optOutAddrs">{"Your Company's Address"}</label>
                    <div className="row m-lr-0" style={{display: isAddressDisplay}}>
                      <div id="optOutAddress" className="inline-tiny-mce opt-out-address" />
                    </div>
                  </div>
                </div>
                {/* Popup starts here*/}
                  <CampaignIssuesPreviewPopup
                    emailSubject={emailSubject}
                    emailContent={emailContent}
                    peopleList={getAllPeopleList}
                    personIssues={personIssues}
                    allFields={allFields}
                    closeCallback={this.closeCallback}
                    ref="issues"
                  />
                {/* Popup ends here*/}
            </div>
          </div>
          <div className="left" style={{display: followups.length ? "block" : "none"}}>
            <input type="checkbox" className="filled-in" id="weekendFollowupCheck"
              defaultChecked="checked"
              onChange={() => this.toggleSetState("isWeekendFollowUpDisabled")}
              />
            <label htmlFor="weekendFollowupCheck">Avoid weekend follow ups
              (Fri 8:00 PM - Mon 8:00 AM)</label>
          </div>
          <div className="m-b-20 right-align"
            style={{display: followups.length ? "block" : "none"}}>
            Follow ups automatically stop if a recipient responds to any of
            your emails.
          </div>
          {
            followups.map(function (followUp, key) {
              let followUpNumber = _.clone(key);
              return (
                <AddFollowups followupId={followUp.id}
                  content={followUp.content}
                  daysAfter={followUp.daysAfter}
                  getAllTags={getAllTags}
                  commonSmartTags={commonSmartTags}
                  deleteFollowUp={this.deleteFollowUp}
                  peopleList={getAllPeopleList}
                  id={key} key={followUp.id}
                  followUpNumber={++followUpNumber}
                  ref={`addFollowups${followUp.id}`} />
              );
            }, this)
          }
          <div className="fixed-action-btn horizontal tooltipped" onClick={this.addFollowups}
            style={{display: displayAddFollowup}}
            data-position="left" data-tooltip="Add Follow up">
            <a className="btn-floating btn-medium blue">
              <i className="large material-icons">add</i>
            </a>
          </div>
          {
            isPreview
              ? <PreviewMailsPopup
                  peopleList={getAllPeopleList}
                  mainEmailContent={previewMainTemplate}
                  followupsEmailContent={previewFollowups}
                  emailSubject={emailSubject}
                  emailContent={emailContent}
                  getOptText={this.getOptText}
                  closePreviewCallback={this.closePreviewCallback}
                  ref="preview" />
              : ""
          }
          <WordaiPreviewPopup ref="wordai" />
        </div>
        {/* Alert Box modal */}
        <AlertModal ref="confirmBox"
          message={alertMsg}
          successBtn={successBtn}
          cancelBtn={cancelBtn}
          confirmCb={this.changeImproveDelivery}/>
      </div>
    );
  }
}

export default ScheduleEmail;
