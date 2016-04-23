import React from "react";
import ReactDOM from "react-dom";
import autobind from "autobind-decorator";
import CampaignStore from "../../stores/CampaignStore";
import PreviewCampaignPopup from "./PreviewCampaignPopup.react";

class AddFollowups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: true,
      errorCount: 0,
      personIssues: [],
      emailText: ""
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    let followupId = this.props.followupId;
    let emailContentId = `#emailContent${followupId}`;
    let mytoolbar = `#mytoolbar${followupId}`;
    let insertSmartTags = `#insertSmartTags${followupId}`;
    let smartTagDrpDwnId = `#dropdown${followupId}`;
    initTinyMCE(emailContentId, mytoolbar, smartTagDrpDwnId,
      this.tinyMceCb, this.editorOnBlur);
    this.el.find("select").material_select();
    initTimePicker(this.el.find(".timepicker"));
    enabledropDownBtnByID(insertSmartTags);
  }

  @autobind
  tinyMceCb(editor) {
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
  editorOnBlur(editor) {
    let text = editor.getBody().textContent;
    this.setState({
      emailText: text
    });
  }

  @autobind
  toggleEditContainer(e) {
    this.setState({clicked: !this.state.clicked});
    this.el.find(".draft-template").slideToggle("slow");
  }

  onChange(event, field) {
    let state = {};
    state[field] = event.target.value;
    this.setState(state);
  }

  openPreviewModal() {
    this.refs.preview.openModal();
  }

  @autobind
  closeCallback(){
    if(!this.refs.preview.state.personIssues.length){
      this.setState((state) => ({
        errorCount: 0
      }));
    }
  }

  render() {
    let followupId = this.props.followupId;
    let indexInc = 1;
    let followUpCount = this.props.id + indexInc;
    let className = this.state.clicked
      ? "mdi mdi-chevron-up"
      : "mdi mdi-chevron-up in-active";
    return(
      <div className="row draft-container m-lr-0">
        <div className="head" onClick={this.toggleEditContainer}>
          <div className="col s4 m4 l4">
            <h3>{followUpCount}. Follow up {followUpCount}</h3>
          </div>
          <div className="col s6 m6 l6 editor-text">
            &nbsp;
            {this.state.emailText}
          </div>
          <div className="col s2 m2 l2">
            <i className={className}>
            </i>
            <i className="mdi mdi-delete-forever"
              onClick={this.props.deleteFollowUp}>
            </i>
          </div>
        </div>
        <div id={"followUps" + followupId} className="col s12 m12 l10 offset-l1 draft-template">
          <div className="row m-lr-0 schedule-time">
            <div className="col s12 m4 l3">
              <div className="input-field">
                <select>
                  <option value="1, 'days'">1 day</option>
                  <option value="2, 'days'">2 days</option>
                  <option value="3, 'days'">3 days</option>
                </select>
                <label>Send if no response after</label>
              </div>
            </div>
            <div className="col s12 m4 l3">
              <label>Time</label>
              <input type="text" className="timepicker border-input" placeholder="00:00AM" />
            </div>
          </div>
            {/* email subject */}
            <div className="row email-subject m-lr-0">
              <input type="text" className="border-input"
                placeholder="Campaign subject"
                onChange={(e) => this.onChange(e, "subject")} />
            </div>
            <div className="row email-content m-lr-0">
              <div className="tiny-toolbar" id={"mytoolbar" + followupId}>
                <div className="right smart-tag-container">
                  <div id={"insertSmartTags" + followupId} className="btn btn-dflt dropdown-button sm-icon-btn" data-activates={"dropdown" + followupId}>
                    <i className="left mdi mdi-code-tags"></i>
                    <span>Insert Smart Tags</span>
                  </div>
                    <ul id={"dropdown" + followupId} className="dropdown-content">
                      {
                        this.props.commonSmartTags.map(function(tag, key) {
                          return (
                            <li key={key}>
                              <a className="common" href="javascript:;">{tag}</a>
                            </li>
                          );
                        })
                      }
                      {
                        this.props.unCommonSmartTags.map(function(tag, key) {
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
              <div id={"emailContent" + followupId} className="email-body"
                dangerouslySetInnerHTML={{__html: this.props.content}} />
            </div>
            {/* Preview button */}
            {
              this.state.errorCount
                ?
                  <div className="row r-btn-container preview-content m-lr-0">
                    <div onClick={() => this.openPreviewModal()} className="btn btn-dflt error-btn">
                      {this.state.errorCount} Issues Found
                    </div>
                  </div>
                :
                  ""
            }
            {/* Popup starts here*/}
            <PreviewCampaignPopup
              emailSubject={this.state.subject}
              emailContent={this.state.emailContent}
              peopleList={this.state.getAllPeopleList}
              personIssues={this.state.personIssues}
              closeCallback={this.closeCallback}
              ref="preview"
            />
            {/* Popup ends here*/}
        </div>
      </div>
    );
  }
}

export default AddFollowups;
