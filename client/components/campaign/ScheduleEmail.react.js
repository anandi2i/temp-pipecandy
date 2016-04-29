import React from "react";
import ReactDOM from "react-dom";
import update from "react-addons-update";
import AddFollowups from "./AddFollowups.react";
import CampaignIssuesPreviewPopup from "./CampaignIssuesPreviewPopup.react";
import PreviewMailsPopup from "./PreviewMailsPopup.react";
import CampaignStore from "../../stores/CampaignStore";

class ScheduleEmail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 3,
      clicked: true,
      followups: [],
      followusMaxLen: 5,
      displayScheduleCampaign: false,
      emailList: [],
      commonSmartTags: [],
      unCommonSmartTags: [],
      emailContent: "",
      errorCount: 0,
      issueTags: [],
      personIssues: [],
      emailText: "",
      mainEmailContent: {},
      followupsEmailContent: []
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignStore.addEmailListChangeListener(this.onStoreChange);
    enabledropDownBtnByID("#insertSmartTags");
    this.el.find("select").material_select();
    initDatePicker(this.el.find(".datepicker"));
    initTimePicker(this.el.find(".timepicker"));
  }

  componentWillUnmount() {
    CampaignStore.removeEmailListChangeListener(this.onStoreChange);
  }

  initTinyMCE() {
    initTinyMCE("#emailContent", "#mytoolbar", "#dropdown", this.tinyMceCb,
      this.editorOnBlur);
  }

  tinyMceCb = (editor) => {
    let content = editor.getContent();
    let issueTags = getIssueTagsInEditor(content);
    let personIssues = CampaignStore.getIssuesPeopleList(issueTags);
    this.setState({
      emailContent: content,
      errorCount: parseInt(issueTags.length, 10),
      issueTags: issueTags,
      personIssues: personIssues
    });
  }

  editorOnBlur = (editor) => {
    let text = editor.getBody().textContent;
    this.setState({
      emailText: text
    });
  }

  onStoreChange = () => {
    let selectedEmailList = CampaignStore.getSelectedEmailList();
    this.setState({
      emailList: selectedEmailList.emailList || [],
      commonSmartTags: selectedEmailList.commonSmartTags || [],
      unCommonSmartTags: selectedEmailList.unCommonSmartTags || [],
      getAllPeopleList: selectedEmailList.peopleList || []
    });
    this.initTinyMCE();
  }

  toggleEditContainer = () => {
    this.setState({clicked: !this.state.clicked});
    this.el.find(".draft-template").slideToggle("slow");
  }

  addFollowups = () => {
    let maxLength = 5;
    if(this.state.followups.length < maxLength) {
      this.setState((state) => ({
        followups: state.followups.concat({
          id: guid(),
          content: "click here to edit",
        })
      }));
    }
  }

  displayScheduleCampaign = () => {
    this.setState({
      displayScheduleCampaign: !this.state.displayScheduleCampaign
    });
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

  onChange(event, field) {
    let state = {};
    state[field] = event.target.value;
    this.setState(state);
  }

  openPreviewModal(preview) {
    if(preview === "issues") {
      this.refs.issues.openModal();
    } else {
      let followups = [];
      let followupsError = true;
      this.state.followups.map((val, key) => {
        let content = this.refs[`addFollowups${val.id}`].refs.issues;
        let emailSubject = content.props.emailSubject;
        let emailContent = content.props.emailContent;
        content.state.emailSubject = emailSubject;
        content.state.emailContent = emailContent;
        followups.push(content.state);
        if(content.props.personIssues.length){
          followupsError = false;
        }
      }, this);
      this.setState((state) => ({
        mainEmailContent: this.refs.issues.state,
        followupsEmailContent: followups
      }), () => {
        if(!this.state.errorCount &&
          !this.state.mainEmailContent.personIssues.length && followupsError){
            this.refs.preview.openModal();
        } else {
          console.log("fix all smart tag values");
        }
      });
    }
  }

  saveCampaignInfo = () => {
    let followups = [];
    this.state.followups.map(function(val, key){
     followups.push(this.refs[`addFollowups${val.id}`]);
    }, this);
    this.setState((state) => ({
      mainEmailContent: this.refs.issues.state,
      followupsEmailContent: followups
    }), function(){
      console.log(this.state.mainEmailContent);
      //TODO Need to construct data here
      console.log(this.state.followupsEmailContent);
    });
  }

  closeCallback = () => {
    if(!this.refs.issues.state.personIssues.length){
      this.setState((state) => ({
        errorCount: 0
      }));
    }
  }

  render() {
    let displayIndex =
      (this.props.active === this.state.index ? "block" : "none");
    let displayAddFollowup =
      (this.state.followups.length < this.state.followusMaxLen
        ? "block" : "none");
    let displaySchedule = this.state.displayScheduleCampaign
      ? "block" : "none";
    let className = this.state.clicked
      ? "mdi mdi-chevron-up"
      : "mdi mdi-chevron-up in-active";

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
          <div id="firstEmail" className="col s12 m12 l10 offset-l1 draft-template">
              {/* email to list */}
              <div className="row m-lr-0">
                <div className="col s12 p-lr-0">
                  <input type="checkbox" className="filled-in" id="filled-in-box"
                    defaultChecked=""
                    onChange={this.displayScheduleCampaign} />
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
                          <span className="title">{list.name}</span>
                          <span className="count">{list.peopleCount}</span>
                          <i className="material-icons">close</i>
                        </div>
                      );
                    }, this)
                  }
                </div>
              </div>
              {/* email subject */}
              <div className="row email-subject m-lr-0">
                <input type="text" className="border-input"
                  placeholder="Campaign subject"
                  onChange={(e) => this.onChange(e, "subject")} />
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
                <div id="emailContent" className="email-body"
                  dangerouslySetInnerHTML={{
                    __html: this.props.selectedTemplate
                  }} />
              </div>
              {/* Preview button */}
              {
                this.state.errorCount
                  ?
                    <div className="row r-btn-container preview-content m-lr-0">
                      <div onClick={() => this.openPreviewModal("issues")} className="btn btn-dflt error-btn">
                        {this.state.errorCount} Issues Found
                      </div>
                    </div>
                  :
                    ""
              }
              {/* Popup starts here*/}
                <CampaignIssuesPreviewPopup
                  emailSubject={this.state.subject}
                  emailContent={this.state.emailContent}
                  peopleList={this.state.getAllPeopleList}
                  personIssues={this.state.personIssues}
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
                commonSmartTags={this.state.commonSmartTags}
                unCommonSmartTags={this.state.unCommonSmartTags}
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
          emailSubject={this.state.subject}
          emailContent={this.state.emailContent}
          ref="preview"/>
      </div>
    );
  }
}

export default ScheduleEmail;
