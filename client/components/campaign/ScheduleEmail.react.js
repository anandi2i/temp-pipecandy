import React from "react";
import ReactDOM from "react-dom";
import update from "react-addons-update";
import _ from "underscore";
import AddFollowups from "./AddFollowups.react";
import CampaignIssuesPreviewPopup from "./CampaignIssuesPreviewPopup.react";
import PreviewMailsPopup from "./PreviewMailsPopup.react";
import CampaignStore from "../../stores/CampaignStore";
import UserStore from "../../stores/UserStore";
import UserAction from "../../actions/UserAction";
import CampaignActions from "../../actions/CampaignActions";

class ScheduleEmail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 3,
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
      spamRating: ""
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignStore.addEmailListChangeListener(this.onStoreChange);
    CampaignStore.addSpamScoreChangeListener(this.onSpamScoreChange);
    enabledropDownBtnByID("#insertSmartTags");
    this.el.find("select").material_select();
    initDatePicker(this.el.find(".datepicker"));
    initTimePicker(this.el.find(".timepicker"));
  }

  componentWillUnmount() {
    CampaignStore.removeEmailListChangeListener(this.onStoreChange);
    CampaignStore.removeSpamScoreChangeListener(this.onSpamScoreChange);
  }

/**
 * Call init tinyMCE editor
 *
 * @param  {object} allTags - It contains collection of unique smart-tags based on selected list
 */
  initTinyMCE(allTags) {
    if(tinymce.get("emailContent")) {
      tinyMCE.execCommand("mceRemoveEditor", true, "emailContent");
    }
    initTinyMCE("#emailContent", "#mytoolbar", "#dropdown", allTags, true,
      this.tinyMceCb);
    if(tinymce.get("emailSubject")) {
      tinyMCE.execCommand("mceRemoveEditor", true, "emailSubject");
    }
    initTinyMCE("#emailSubject", "", "", allTags, false, this.tinyMceSubCb);
    const mainContent = this.props.selectedTemplate;
    const tinyMceDelayTime = 500;
    //TODO need to remove setTimeout
    if(mainContent){
      this.setState({
        emailContent: mainContent
      }, () => {
        setTimeout(function(){
          tinyMCE.get("emailContent").setContent(mainContent);
        }, tinyMceDelayTime);
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
    this.setState({
      emailList: selectedEmailList.emailList || [],
      commonSmartTags: selectedEmailList.commonSmartTags || [],
      unCommonSmartTags: selectedEmailList.unCommonSmartTags || [],
      getAllPeopleList: selectedEmailList.peopleList || [],
      allFields: selectedEmailList.allFields || [],
      user: user,
      optText: user.optText || "",
      address: user.address || ""
    }, () => {
      let allTags = {
        commonSmartTags: this.state.commonSmartTags,
        unCommonSmartTags: this.state.unCommonSmartTags
      };
      this.setState({
        getAllTags: CampaignStore.constructSmartTags(allTags)
      }, () => {
        this.initTinyMCE(this.state.getAllTags);
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
          content: "click here to edit",
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
  deleteFollowUp(key, event) {
    let howMany = 1;
    this.setState({
      followups: update(this.state.followups, {$splice: [[key, howMany]]})
    });
  }

  //TODO: has to be removed in future
  updateFollowUpContent() {
    let followups = this.state.followups;
    followups.forEach(function(followup) {
      if($("#emailContent" + followup.id).length) {
        followup.content = tinyMCE.get("emailContent" + followup.id)
          .getContent();
      }
    });
    this.setState((state) => ({
      followups: followups
    }));
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
      this.setState({
        personIssues: this.getPersonIssues()
      }, () => {
        this.refs.issues.openModal();
      });
    } else {
      // Check if all missing tags are fixed
      if(this.checkEmailContentError()) {
        this.refs.preview.openModal();
      }
    }
  }

 /**
  * Check if all missing tags are fixed by user
  * @return {boolean}
  */
  checkEmailContentError() {
    let followupsError = true;
    this.state.followups.map((val, key) => {
      let content = this.refs[`addFollowups${val.id}`].refs.issues;
      if(content.props.personIssues.length){
        followupsError = false;
      }
    }, this);
    let mainEmailErr = this.refs.issues.state.personIssues.length;
    if(!this.state.errorCount && !mainEmailErr && followupsError){
        return true;
    }
    displayError("Fix all smart tag values");
    console.log("Fix all smart tag values");
    return false;
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
        let template = {};
        template.subject = this.state.emailSubject;
        template.content = this.state.emailContent;
        template.usedTagIds = CampaignStore.usedTagIds(
          template.subject.concat(template.content)).usedTagIds;
        template.userId = getCookie("userId");
        mainEmailContent = {
          listIds: _.pluck(this.state.emailList, "id"),
          campaignTemplates: template
        };
      } else {
        let mainTemplate = this.refs.issues.state;
        mainEmailContent = this.constructSavedTemplateObjects(mainTemplate);
      }
      let followups = [];
      this.state.followups.map(function(val, key) {
        let followup = this.refs[`addFollowups${val.id}`].refs.issues.state;
        let followupObj = this.constructSavedTemplateObjects(followup);
        followups.push(followupObj);
      }, this);
      this.setState((state) => ({
        mainEmailContent: mainEmailContent,
        followupsEmailContent: followups
      }), function(){
        CampaignActions.saveCampaignTemplates({
          id: this.props.campaignId,
          templates: this.state.mainEmailContent
        });
        console.log(this.state.mainEmailContent);
        console.log(this.state.followupsEmailContent);
      });
    }
  }

  constructSavedTemplateObjects(mainTemplate){
    const index = 0, removed = 0;
    let listIds = _.pluck(this.state.emailList, "id");
    let template = {};
    let issuesCompletedList = [];
    issuesCompletedList = _.clone(mainTemplate.issuesCompletedList);
    template.subject = mainTemplate.emailSubject;
    template.content = mainTemplate.emailContent;
    template.usedTagIds = mainTemplate.usedTagIds;
    template.userId = getCookie("userId");
    issuesCompletedList.splice(index, removed, template);
    return {
      listIds: listIds,
      campaignTemplates: issuesCompletedList
    };
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

  render() {
    let selectEmailListIndex = 1;
    let displayIndex =
      (this.props.active === this.state.index ? "block" : "none");
    let displayAddFollowup =
      (this.state.followups.length < this.state.followupsMaxLen
        ? "block" : "none");
    let displaySchedule = this.state.displayScheduleCampaign
      ? "block" : "none";
    let isOptText = this.state.isOptText ? "block" : "none";
    let isAddress = this.state.isAddress ? "block" : "none";
    let className = this.state.clicked
      ? "mdi mdi-chevron-up"
      : "mdi mdi-chevron-up in-active";
    const {spamRating, errorCount} = this.state;
    let spamClass = "spam-result safe";
    if(spamRating === "DANGER") {
      spamClass = "spam-result danger";
    } else if (spamRating === "CAREFUL") {
      spamClass = "spam-result careful";
    }

    return (
      <div className="container" style={{display: displayIndex}}>
        <div className="row sub-head-container m-lr-0">
          <div className="head">Let's Draft an Email</div>
          <div className="sub-head">
            <a className="btn blue m-r-20" onClick={() => this.openPreviewModal("preview")}>Preview</a>
            <a className="btn blue" onClick={this.saveCampaignInfo}>Save & continue</a>
          </div>
        </div>
        {/* Draft Email starts here*/}
        <div className="row draft-container m-t-50 m-lr-0">
          <div className="head" onClick={this.toggleEditContainer}>
            <div className="col s4 m4 l4"><h3>1. First Email</h3></div>
            <div className="col s6 m6 l6 editor-text">
              &nbsp;
              {this.state.emailText}
            </div>
            <div className="col s2 m2 l2">
              <i className={className}>
              </i>
            </div>
          </div>
          <div id="mainTemplate" className="col s12 m12 l10 offset-l1 draft-template">
              {/* email to list */}
              <div className="row m-lr-0">
                <div className="col s12 p-lr-0">
                  <input onChange={() => this.toggleSetState("displayScheduleCampaign")}
                    type="checkbox" className="filled-in"
                    id="filled-in-box" defaultChecked="" />
                  <label htmlFor="filled-in-box">Schedule campaign for later</label>
                </div>
              </div>
              <div className="row m-lr-0 schedule-time" style={{display: displaySchedule}}>
                <div className="col s12 m4 l3">
                  <label>Date</label>
                  <input type="date" className="datepicker border-input"
                    placeholder="DD Month, year"
                    onChange={(e) => this.onChange(e, "scheduledDate")} />
                </div>
                <div className="col s12 m4 l3">
                  <label>Time</label>
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
                    this.state.emailList.map(function(list, key) {
                      return (
                        <div key={key} className="chip">
                          <div className="title-wrapper">
                            <span className="title">{list.name}</span>
                          </div>
                          <span className="count">{list.peopleCount}</span>
                          <i onClick={(e) => this.deleteList(e, list.id)}
                            className="mdi mdi-close remove-list"></i>
                        </div>
                      );
                    }, this)
                  }
                </div>
                <div className="right-part m-t-5"
                   style={{display: this.state.emailList.length ?
                   "none" : "block"}}>
                   <a onClick={ () => this.props.handleClick(selectEmailListIndex)}>
                     select email list
                   </a>
                </div>
              </div>
              {/* email subject */}
              <div className="row email-subject m-lr-0">
                <div id="emailSubject" className="email-body inline-tiny-mce" />
              </div>
              <div className="row email-content m-lr-0">
                <div className="tiny-toolbar" id="mytoolbar">
                  <div className="right smart-tag-container">
                    <div id="insertSmartTags" className="btn btn-dflt dropdown-button sm-icon-btn" data-activates="dropdown">
                      <i className="left mdi mdi-code-tags"></i>
                      <span>Insert Smart Tags</span>
                    </div>
                      <ul id="dropdown" className="dropdown-content">
                        {
                          this.state.commonSmartTags.map(function(tag, key) {
                            return (
                              <li key={key}>
                                <a className="common" href="javascript:;">{tag}</a>
                              </li>
                            );
                          })
                        }
                        {
                          this.state.unCommonSmartTags.map(function(tag, key) {
                            return (
                              <li key={key}>
                                <a className="un-common" href="javascript:;">{tag}</a>
                              </li>
                            );
                          })
                        }
                      </ul>
                  </div>
                </div>
                <div id="emailContent" className="email-body" />
              </div>
              {/* Preview button */}
              <div className="row r-btn-container m-lr-0">
                <div className={spamClass}
                  style={{display: spamRating ? "inline-block": "none"}}>
                  SPAM RATING: {spamRating}
                </div>
                <div onClick={this.checkSpam} className="btn btn-dflt btn-blue"
                  style={{display: spamRating ? "none": "inline-block"}}>
                  Check Spam
                </div>
                <div onClick={() => this.openPreviewModal("issues")}
                  style={{display: errorCount ? "inline-block": "none"}}
                  className="btn btn-dflt error-btn" >
                  {errorCount} Issues Found
                </div>
              </div>
              <div className="row opt-text">
                <div className="col s12 m-lr-0">
                  <input type="checkbox" className="filled-in" id="optOutText"
                    defaultChecked="checked"
                    onChange={() => this.toggleSetState("isOptText")} />
                  <label htmlFor="optOutText">Opt-Out-Text</label>
                  <div className="input-field" style={{display: isOptText}}>
                    <input id="optOutText" placeholder="Opt-Out-Text"
                      type="text"
                      value={this.state.optText}
                      className="border-input"
                      onChange={(e) => this.onChange(e, "optText")}
                      name="optOutText" />
                  </div>
                </div>
              </div>
              <div className="row opt-text">
                <div className="col s12 m-lr-0">
                  <input type="checkbox" className="filled-in" id="optOutAddress"
                    defaultChecked="checked"
                    onChange={() => this.toggleSetState("isAddress")} />
                  <label htmlFor="optOutAddress">Address</label>
                  <div className="input-field" style={{display: isAddress}}>
                    <textarea id="optOutAddress" placeholder="Address"
                      type="text"
                      value={this.state.address}
                      name="Address"
                      onChange={(e) => this.onChange(e, "address")}
                      className="border-input materialize-textarea" />
                  </div>
                </div>
              </div>
              {/* Popup starts here*/}
                <CampaignIssuesPreviewPopup
                  emailSubject={this.state.emailSubject}
                  emailContent={this.state.emailContent}
                  peopleList={this.state.getAllPeopleList}
                  personIssues={this.state.personIssues}
                  allFields={this.state.allFields}
                  closeCallback={this.closeCallback}
                  ref="issues"
                />
              {/* Popup ends here*/}
          </div>
        </div>
        {
          this.state.followups.map(function (followUp, key) {
            return (
              <AddFollowups followupId={followUp.id}
                content={followUp.content}
                getAllTags={this.state.getAllTags}
                deleteFollowUp={this.deleteFollowUp.bind(this, key)}
                peopleList={this.state.getAllPeopleList}
                id={key} key={followUp.id}
                ref={`addFollowups${followUp.id}`} />
            );
          }, this)
        }
        <div className="row add-followups m-lr-0"
          onClick={this.addFollowups}
          style={{display: displayAddFollowup}}>
          <i className="mdi mdi-plus"></i> Add Follow up
        </div>
        <PreviewMailsPopup
          peopleList={this.state.getAllPeopleList}
          mainEmailContent={this.state.mainEmailContent}
          followupsEmailContent={this.state.followupsEmailContent}
          emailSubject={this.state.emailSubject}
          emailContent={this.state.emailContent}
          getOptText={this.getOptText}
          ref="preview"/>
      </div>
    );
  }
}

export default ScheduleEmail;
