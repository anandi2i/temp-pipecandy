import React from "react";
import ReactDOM from "react-dom";
import CampaignStore from "../../stores/CampaignStore";
import CampaignIssuesPreviewPopup from "./CampaignIssuesPreviewPopup.react";

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
      emailRawText: ""
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
    initTimePicker(this.el.find(".timepicker"));
    enabledropDownBtnByID(`#insertSmartTags${this.props.followupId}`);
    this.initTinyMCE();
    CampaignStore.addEmailListChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeEmailListChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.initTinyMCE();
  }

  initTinyMCE() {
    let followupId = this.props.followupId;
    let emailContentId = `#emailContent${followupId}`;
    let mytoolbar = `#mytoolbar${followupId}`;
    let smartTagDrpDwnId = `#dropdown${followupId}`;
    if(tinymce.get(`emailContent${followupId}`)) {
      tinyMCE.execCommand("mceRemoveEditor", true, `emailContent${followupId}`);
    }
    initTinyMCE(emailContentId, mytoolbar, smartTagDrpDwnId,
      this.props.getAllTags, true, this.tinyMceCb);
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

  openPreviewModal = () => {
    let content = tinymce.get(`emailContent${this.props.followupId}`)
      .getContent();
    let issueTags = getIssueTagsInEditor(content);
    let personIssues = CampaignStore.getIssuesPeopleList(issueTags);
    this.setState({
      personIssues: personIssues
    }, () => this.refs.issues.openModal());
  }

  closeCallback = () => {
    if(!this.refs.issues.state.personIssues.length){
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
    let checkErrorCount = this.state.errorCount
      ? "email-body" : "email-body clear-err-count";
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
              <div className="input-field" id={"dayPicker" + followupId}>
                <select>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                </select>
                <label>Send if no response after</label>
              </div>
            </div>
            <div className="col s12 m4 l3">
              <label>Time</label>
              <input type="text" className="timepicker border-input" placeholder="00:00AM" />
            </div>
          </div>
            <div className="row email-content m-lr-0">
              <div className="tiny-toolbar" id={"mytoolbar" + followupId} />
              <div id={"emailContent" + followupId} className={checkErrorCount}
                dangerouslySetInnerHTML={{__html: this.props.content}} />
            </div>
            {/* Preview button */}
            {
              this.state.errorCount
                ?
                  <div className="row r-btn-container preview-content m-lr-0">
                    <div onClick={this.openPreviewModal} className="btn btn-dflt error-btn">
                      {this.state.errorCount} Issues Found
                    </div>
                  </div>
                :
                  ""
            }
            {/* Popup starts here*/}
            <CampaignIssuesPreviewPopup
              emailSubject=""
              emailContent={this.state.emailContent}
              peopleList={this.props.peopleList}
              personIssues={this.state.personIssues}
              closeCallback={this.closeCallback}
              ref="issues"
            />
            {/* Popup ends here*/}
        </div>
      </div>
    );
  }
}

export default AddFollowups;
