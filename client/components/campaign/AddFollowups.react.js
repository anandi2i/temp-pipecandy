import React from "react";
import ReactDOM from "react-dom";
import AlertModal from "../AlertModal.react";
import CampaignStore from "../../stores/CampaignStore";
import CampaignIssuesPreviewPopup from "./CampaignIssuesPreviewPopup.react";
import {ErrorMessages} from "../../utils/UserAlerts";
import _ from "underscore";

class AddFollowups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: true,
      errorCount: 0,
      editorErrorCount: 0,
      personIssues: [],
      emailText: "",
      emailContent: "",
      emailRawText: "",
      deleteCampaignId: null,
      days: "1"
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select(() => this.handleDayChange());
    initTimePicker(this.el.find(".timepicker"));
    this.initTinyMCE();
    CampaignStore.addEmailListChangeListener(this.onStoreChange);
    this.el.find(".tooltipped").tooltip({delay: 50});
  }

  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeEmailListChangeListener(this.onStoreChange);
    this.el.find(".tooltipped").tooltip("remove");
  }

  onStoreChange = () => {
    this.initTinyMCE();
  }

  initTinyMCE() {
    let {followupId, content, commonSmartTags} = this.props;
    let emailContentId = `#emailContent${followupId}`;
    let mytoolbar = `#mytoolbar${followupId}`;
    let smartTagDrpDwnId = `#dropdown${followupId}`;
    content = CampaignStore.parseContent(content, commonSmartTags);
    if(tinymce.get(`emailContent${followupId}`)) {
      tinyMCE.execCommand("mceRemoveEditor", true, `emailContent${followupId}`);
    }
    initTinyMCE(emailContentId, mytoolbar, smartTagDrpDwnId,
      this.props.getAllTags, true, this.tinyMceCb, content);
  }

  tinyMceCb = (editor) => {
    let content = editor.getContent();
    let issueTags = getIssueTagsInEditor(content);
    let personIssues = CampaignStore.getIssuesPeopleList(issueTags);
    this.setState({
      emailContent: content,
      errorCount: parseInt(issueTags.length, 10),
      editorErrorCount: parseInt(issueTags.length, 10),
      issueTags: issueTags,
      personIssues: personIssues,
      emailRawText: editor.getBody().textContent
    });
  }

  toggleEditContainer = (e) => {
    //Ignore delete icon click
    if(e.target.className !== "mdi mdi-delete-forever") {
      this.setState({
        clicked: !this.state.clicked
      }, () => {
        this.el.find(".draft-template").slideToggle("slow");
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
  }

  openPreviewModal = () => {
    let content = tinymce.get(`emailContent${this.props.followupId}`)
      .getContent();
    let issueTags = getIssueTagsInEditor(content);
    let personIssues = CampaignStore.getIssuesPeopleList(issueTags);
    if(this.props.peopleList.length){
      this.setState({
        personIssues: personIssues
      }, () => this.refs.issues.openModal());
    } else {
      displayError(ErrorMessages.EmptyEmailList);
    }
  }

  /**
   * Call alert confirm modal popup and set followupid to state variable
   * @param  {number} id followupid to delete
   */
  getConfirmation = (id) => {
    this.setState({
      deleteCampaignId: id
    }, () => {
      this.refs.confirmBox.openModal();
    });
  }

  /**
   * Delete followup container based on id and
   * set deleteCampaignId state to null
   */
  deleteCampaignFollowUp = (isTrue) => {
    if(isTrue){
      this.props.deleteFollowUp(this.state.deleteCampaignId);
    }
    this.setState({
      deleteCampaignId: null
    });
  }

  closeCallback = () => {
    if(!this.refs.issues.state.personIssues.length){
      this.setState((state) => ({
        errorCount: 0
      }));
    }
  }

  /**
   * Update the day count state
   */
  handleDayChange() {
    this.setState({
      days: this.refs.days.value
    });
  }

  render() {
    const {followupId, id, content, peopleList} = this.props;
    let indexInc = 1;
    const {days} = this.state;
    const dayCount = `${days} ${days === indexInc.toString() ? "day" : "days"}`;
    const scheduleCount = 30;
    let followUpCount = id + indexInc;
    let className = this.state.clicked
      ? "mdi mdi-chevron-up"
      : "mdi mdi-chevron-up in-active";
    let checkErrorCount = this.state.errorCount
      ? "email-body" : "email-body clear-err-count";
    let followUpCountTxt;
    let firstFollowup = 1, secondFollowup = 2, thirdFollowup = 3;
    return(
      <div className="row draft-container m-lr-0">
        <div className="head" onClick={this.toggleEditContainer}>
          <div className="col s4 m4 l4">
            <h3>
              {
                (() => {
                  if(followUpCount === firstFollowup) {
                    followUpCountTxt = "1st Followup";
                  } else if (followUpCount === secondFollowup){
                    followUpCountTxt = "2nd Followup";
                  } else if (followUpCount === thirdFollowup){
                    followUpCountTxt = "3rd Followup";
                  } else {
                    followUpCountTxt = `${followUpCount}th Followup`;
                  }
                  return followUpCountTxt;
                })()
              }
            </h3>
          </div>
          <div className="col s6 m6 l6 editor-text">
            &nbsp;
            {this.state.emailText}
          </div>
          <div className="col s2 m2 l2">
            <i className={className}>
            </i>
            <i className="mdi mdi-delete-forever"
              onClick={() => this.getConfirmation(id)}>
            </i>
            <i className="mdi mdi-clock tooltipped" data-position="top"
              data-tooltip={`Will be sent in ${dayCount} after the previous
              email if there's no response.`}>
            </i>
          </div>
        </div>
        <div id={"followUps" + followupId} className="col s12 m12 l10 offset-l1 draft-template">
          <div className="row m-0 schedule-time-label">
            <label>Follow up (if no response to previous email) after</label>
          </div>
          <div className="row m-lr-0 schedule-time">
            <div className="col s12 m4 l3">
              <div className="input-field" id={"dayPicker" + followupId}>
                <select ref="days">
                  {
                    _.range(scheduleCount).map(function(k) {
                      let display = "days";
                      if(++k === indexInc){
                        display = "day";
                      }
                      return (
                        <option key={k} value={k}>{k} {display}</option>
                      );
                    })
                  }
                </select>
                <label></label>
              </div>
            </div>
            {/*<div className="col s12 m4 l3">
              <label></label>
              <input type="text" className="timepicker border-input" placeholder="00:00AM" />
            </div>*/}
          </div>
            <div className="row email-content m-lr-0">
              <div className="tiny-toolbar" id={"mytoolbar" + followupId} />
              <div id={"emailContent" + followupId} className={checkErrorCount}
                dangerouslySetInnerHTML={{__html: content}} />
            </div>
            {/* Preview button */}
            {
              this.state.errorCount
                ?
                  <div className="row r-btn-container preview-content m-lr-0">
                    <div onClick={this.openPreviewModal} className="btn btn-dflt error-btn">
                      {this.state.errorCount} Issue(s) Found
                    </div>
                  </div>
                :
                  ""
            }
            {/* Popup starts here*/}
            <CampaignIssuesPreviewPopup
              emailSubject=""
              emailContent={this.state.emailContent}
              peopleList={peopleList}
              personIssues={this.state.personIssues}
              closeCallback={this.closeCallback}
              ref="issues"
            />
            {/* Popup ends here*/}
        </div>
        {/* Alert Box modal */}
        <AlertModal ref="confirmBox"
          message={"You took some effort doing this. Are you sure?"}
          successBtn={"Confirm"}
          cancelBtn={"Cancel"}
          confirmCb={this.deleteCampaignFollowUp}/>
      </div>
    );
  }
}

export default AddFollowups;
