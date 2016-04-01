import React from "react";
import autobind from "autobind-decorator";

class AddFollowups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: true
    };
  }

  componentDidMount() {
    let followupId = this.props.followupId;
    let emailContentId = "#emailContent" + followupId;
    let mytoolbar = "#mytoolbar" + followupId;
    let insertSmartTags = "#insertSmartTags" + followupId;
    let smartTagDrpDwnId = "#dropdown" + followupId;
    initTinyMCE(emailContentId, mytoolbar, smartTagDrpDwnId);
    enabledropDownBtnByID(insertSmartTags);
  }

  @autobind
  toggleEditContainer(e) {
    this.setState({clicked: !this.state.clicked});
    $("#followUps" + this.props.followupId).slideToggle("slow");
  }

  render(){
    let followupId = this.props.followupId;
    let indexInc = 1;
    let followUpCount = this.props.id + indexInc;
    let className = this.state.clicked
      ? "mdi mdi-chevron-up"
      : "mdi mdi-chevron-up in-active";
    return(
      <div className="row draft-container m-lr-0">
        <div className="head">
          <div className="col s4 m4 l4">
            <h3>{followUpCount}. Follow up {followUpCount}</h3>
          </div>
          <div className="col s8 m8 l8">
            <i className={className}
              onClick={this.toggleEditContainer}>
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
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
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
              <input type="text" className="border-input" placeholder="Campaign subject"></input>
            </div>
            <div className="row email-content m-lr-0">
              <div className="tiny-toolbar" id={"mytoolbar" + followupId}>
                <div className="right smart-tag-container">
                  <div id={"insertSmartTags" + followupId} className="btn btn-dflt dropdown-button sm-icon-btn" data-activates={"dropdown" + followupId}>
                    <i className="left mdi mdi-code-tags"></i>
                    <span>Insert Smart Tags</span>
                  </div>
                    <ul id={"dropdown" + followupId} className="dropdown-content">
                      <li><a href="javascript:;">one</a></li>
                      <li><a href="javascript:;">two</a></li>
                      <li><a href="javascript:;">three</a></li>
                    </ul>
                </div>
              </div>
              <div id={"emailContent" + followupId} className="email-body"
                dangerouslySetInnerHTML={{__html: this.props.content}} />
            </div>
            {/* Preview button */}
            <div className="row r-btn-container preview-content m-lr-0">
              <div className="btn btn-dflt blue sm-icon-btn">
                <i className="left mdi mdi-eye"></i>
                <span>Preview</span>
              </div>
            </div>
        </div>
      </div>
    );
  }
}

export default AddFollowups;
