import React from "react";
import ReactDOM from "react-dom";
import update from "react-addons-update";
import autobind from "autobind-decorator";
import AddFollowups from "./AddFollowups.react";
import PreviewCampaignPopup from "./PreviewCampaignPopup.react";
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
      personIssues: []
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignStore.addEmailListChangeListener(this._onChange);
    enabledropDownBtnByID("#insertSmartTags");
    this.el.find("select").material_select();
    initDatePicker(this.el.find(".datepicker"));
    initTimePicker(this.el.find(".timepicker"));
  }

  componentWillUnmount() {
    CampaignStore.removeEmailListChangeListener(this._onChange);
  }

  initTinyMCE() {
    initTinyMCE("#emailContent", "#mytoolbar", "#dropdown", this.tinyMceCb);
  }

  @autobind
  tinyMceCb(editor){
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

  @autobind
  _onChange() {
    let selectedEmailList = CampaignStore.getSelectedEmailList();
    this.setState({
      emailList: selectedEmailList.emailList || [],
      commonSmartTags: selectedEmailList.commonSmartTags || [],
      unCommonSmartTags: selectedEmailList.unCommonSmartTags || [],
      getAllPeopleList: selectedEmailList.peopleList || []
    });
    this.initTinyMCE();
  }

  toggleEditContainer() {
    this.setState({clicked: !this.state.clicked});
    this.el.find(".draft-template").slideToggle("slow");
  }

  addFollowups() {
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

  @autobind
  displayScheduleCampaign() {
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

  @autobind
  onChange(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
  }

  openPreviewModal() {
    this.refs.preview.openModal();
  }

  saveCampaignInfo() {
    let followups = [];
    this.state.followups.map(function(val, key){
     followups.push(this.refs[`addFollowups${val.id}`]);
    }, this);
    this.setState((state) => ({
      "followupsArr": followups
    }), function(){
      //TODO Need to construct data here
      console.log(this.state.followupsArr);
    });
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
    let previewClass = this.state.errorCount ?
      "btn btn-dflt error-btn" : "btn btn-dflt blue sm-icon-btn";
    return (
      <div className="container" style={{display: displayIndex}}>
        <div className="row sub-head-container m-lr-0">
          <div className="head">Let's Draft an Email</div>
          <div className="sub-head">
            <a className="btn blue" onClick={() => this.saveCampaignInfo()}>Save & continue</a>
          </div>
        </div>
        {/* Draft Email starts here*/}
        <div className="row draft-container m-t-50 m-lr-0">
          <div className="head" onClick={() => this.toggleEditContainer()}>
            <div className="col s4 m4 l4"><h3>1. First Email</h3></div>
            <div className="col s8 m8 l8">
              <i className={className}>
              </i>
            </div>
          </div>
          <div id="firstEmail" className="col s12 m12 l10 offset-l1 draft-template">
              {/* email to list */}
              <div className="row m-lr-0">
                <div className="col s12 p-lr-0">
                  <input onChange={this.displayScheduleCampaign} type="checkbox" className="filled-in" id="filled-in-box" defaultChecked="" />
                  <label htmlFor="filled-in-box">Schedule campaign for later</label>
                </div>
              </div>
              <div className="row m-lr-0 schedule-time" style={{display: displaySchedule}}>
                <div className="col s12 m4 l3">
                  <label>Date</label>
                  <input type="date" className="datepicker border-input"
                    placeholder="DD Month, year"
                    onChange={this.onChange("scheduledDate")} />
                </div>
                <div className="col s12 m4 l3">
                  <label>Time</label>
                  <input type="text" placeholder="00:00 AM"
                    className="timepicker border-input"
                    onChange={this.onChange("scheduledTime")} />
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
                  onChange={this.onChange("subject")} />
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
              <div className="row r-btn-container preview-content m-lr-0">
                <div onClick={() => this.openPreviewModal()} className={previewClass}>
                  {
                    this.state.errorCount
                    ?
                      `${this.state.errorCount} Issues Found`
                    :
                      <span>
                        <i className="left mdi mdi-eye"></i>
                        Preview
                      </span>
                  }
                </div>
              </div>
              {/* Popup starts here*/}
                <PreviewCampaignPopup
                  emailSubject={this.state.subject}
                  emailContent={this.state.emailContent}
                  peopleList={this.state.getAllPeopleList}
                  personIssues={this.state.personIssues}
                  ref="preview"
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
                id={key} key={followUp.id}
                ref={`addFollowups${followUp.id}`} />
            );
          }, this)
        }
        <div className="row add-followups m-lr-0"
          onClick={() => this.addFollowups()}
          style={{display: displayAddFollowup}}>
          <i className="mdi mdi-plus"></i> Add Follow up
        </div>
      </div>
    );
  }
}

export default ScheduleEmail;
