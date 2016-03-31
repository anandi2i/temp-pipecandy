import React from "react";
import autobind from "autobind-decorator";
import AddFollowups from "./AddFollowups.react";
import PreviewCampaignPopup from "./PreviewCampaignPopup.react";

class ScheduleEmail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 3,
      clicked: true,
      followups: [],
      followusMaxLen: 5,
      displayScheduleCampaign: false
    };
  }

  @autobind
  handleEditorChange(e) {
    console.log(e.target.getContent());
  }

  @autobind
  toggleEditContainer(e) {
     this.setState({clicked: !this.state.clicked});
    $("#firsEmail").slideToggle("slow");
  }

  componentDidUpdate() {
    initTinyMCE("#emailContent", "#mytoolbar");
    initTinyMCE("#emailContent1", "#mytoolbar1");
    enabledropDownBtnByID("#insertSmartTags");
    $("select").material_select();
    $(".datepicker").pickadate({
      selectMonths: true,
      selectYears: 15
    });
    $(".timepicker").pickatime({
      twelvehour: true
    });
  }

  @autobind
  addFollowups() {
    let getLength = this.state.followups.length;
    let maxLength = 5;
    if(getLength < maxLength){
      this.state.followups.push(getLength);
      this.forceUpdate();
    }
  }

  @autobind
  displayScheduleCampaign(){
    this.setState(
      {
        displayScheduleCampaign: !this.state.displayScheduleCampaign
      }
    );
  }

  render() {
    let displayIndex =
      (this.props.active === this.state.index ? "block" : "none");
    let displayAddFollowup =
      (this.state.followups.length < this.state.followusMaxLen
        ? "block" : "none");
    let displaySchedule = this.state.displayScheduleCampaign
      ? "block" : "none";
    var className = this.state.clicked
      ? "mdi mdi-chevron-up"
      : "mdi mdi-chevron-up in-active";
    return (
      <div className="container" style={{display: displayIndex}}>
        <div className="row sub-head-container m-lr-0">
          <div className="head">Let's Draft an Email</div>
          <div className="sub-head">
            <a href="#!" className="btn blue">Save & continue</a>
          </div>
        </div>
        {/* Draft Email starts here*/}
        <div className="row draft-container m-t-50 m-lr-0">
          <div className="head">
            <div className="col s4 m4 l4"><h3>1. First Email</h3></div>
            <div className="col s8 m8 l8">
              <i className={className}
                onClick={this.toggleEditContainer}>
              </i>
            </div>
          </div>
          <div id="firsEmail" className="col s12 m12 l10 offset-l1 draft-template">
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
                  <input type="date" className="datepicker border-input" placeholder="DD Month, year" />
                </div>
                <div className="col s12 m4 l3">
                  <label>Time</label>
                  <input type="text" className="timepicker border-input" placeholder="00:00AM" />
                </div>
              </div>
              <div className="row email-to m-lr-0">
                <div className="left-part">
                  To
                </div>
                <div className="right-part">
                  <div className="chip">
                    <span className="title">SoCal Conference Attendees</span>
                    <span className="count">1234</span>
                    <i className="material-icons">close</i>
                  </div>
                  <div className="chip">
                    <span className="title">SoCal Conference Attendees</span>
                    <span className="count">999</span>
                    <i className="material-icons">close</i>
                  </div>
                  <div className="chip">
                    <span className="title">SoCal Conference Attendees</span>
                    <span className="count">198</span>
                    <i className="material-icons">close</i>
                  </div>
                </div>
              </div>
              {/* email subject */}
              <div className="row email-subject m-lr-0">
                <input type="text" className="border-input" placeholder="Campaign subject"></input>
              </div>
              <div className="row email-content m-lr-0">
                <div className="tiny-toolbar" id="mytoolbar">
                  <div className="right smart-tag-container">
                    <div id="insertSmartTags" className="btn btn-dflt dropdown-button sm-icon-btn" data-activates="dropdown">
                      <i className="left mdi mdi-code-tags"></i>
                      <span>Insert Smart Tags</span>
                    </div>
                      <ul id="dropdown" className="dropdown-content">
                        <li><a href="#!">one</a></li>
                        <li><a href="#!">two</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                        <li><a href="#!">three</a></li>
                      </ul>
                  </div>
                </div>
                <div id="emailContent" className="email-body" onChange={this.handleEditorChange}>Click here to edit!</div>
              </div>
              {/* Preview button */}
              <div className="row r-btn-container preview-content m-lr-0">
                <div className="btn btn-dflt blue sm-icon-btn modal-trigger" href="#previewCampaign">
                  <i className="left mdi mdi-eye"></i>
                  <span>Preview</span>
                </div>
              </div>
              {/* Popup starts here*/}
              <PreviewCampaignPopup />
              {/* Popup ends here*/}
          </div>
        </div>
        {
          this.state.followups.map($.proxy(function (value, key) {
            return (
              <AddFollowups followupId={this.state.followups.length}
                key={key}/>
            );
          }, this))
        }
        <div className="row add-followups m-lr-0"
          onClick={this.addFollowups}
          style={{display: displayAddFollowup}}>
          <i className="mdi mdi-plus"></i> Add Follow up
        </div>
      </div>
    );
  }
}

export default ScheduleEmail;
