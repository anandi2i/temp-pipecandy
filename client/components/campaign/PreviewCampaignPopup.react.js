import React from "react";
import autobind from "autobind-decorator";
import _ from "underscore";

class PreviewCampaignPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      missingTagLen: [],
      emailSubject: this.props.emailSubject,
      peopleList: this.props.peopleList,
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1
    };
  }

  componentDidMount() {
    $("#previewCampaign").openModal({
      dismissible: false
    });
    if(!tinyMCE.get("previewMailContent")){
      initTinyMCEPopUp("#previewMailContent", "#previewToolbar");
      $(".preview-modal-content").mCustomScrollbar({
        theme:"minimal-dark"
      });
    }
    if(this.props.emailContent){
      tinyMCE.get("previewMailContent").setContent(this.props.emailContent);
      // Starts with first person person[0]
      this.applySmartTags(this.state.selectedPerson);
    }
  }

  @autobind
  handleChange(field){
    return event => {
      let state = {};
      state[field] = parseInt(event.target.value, 10) || "";
      this.setState(state);
    };
  }

  @autobind
  handleBlur(){
    let displayPerson = this.state.displayPerson;
    let initCount = this.state.initCount;
    if(displayPerson >= initCount &&
      displayPerson <= this.state.peopleList.length) {
        this.applySmartTags(displayPerson - initCount);
      } else {
        this.setState({
          displayPerson: parseInt(initCount, 10)
        });
        let firstPerson = 0;
        this.applySmartTags(firstPerson);
      }
  }

  @autobind
  slider(position){
    let id = this.state.selectedPerson;
	  let initCount = this.state.initCount;
    let peopleLength = this.state.peopleList.length;
    if(position === "left" && id >= this.state.initCount){
      id -= initCount;
      this.setState({
        displayPerson: this.state.displayPerson - initCount
      });
      this.applySmartTags(id);
    }
    if(position === "right" && id < --peopleLength){
      id += initCount;
      this.setState({
        displayPerson: this.state.displayPerson + initCount
      });
      this.applySmartTags(id);
    }
  }

  @autobind
  applySmartTags(personId){
    let getPersonInfo = this.state.peopleList[personId];
    this.setState({
      selectedPerson: personId,
    });
    let emailContent = this.props.emailContent.replace(/"/g, "'");
    _.map(getPersonInfo, function (value, key) {
      if(key === "fields"){
        _.map(value, function (val, key) {
          let fieldsStr = "<span class='tag un-common' "+
            "contenteditable='false'>&lt;"+val.name+"&gt;</span>";
          let re = new RegExp(fieldsStr, "g");
          emailContent = emailContent.replace(re, val.value);
        });
      }
      let str = "<span class='tag common' "+
        "contenteditable='false'>&lt;"+key+"&gt;</span>";
      let re = new RegExp(str, "g");
      emailContent = emailContent.replace(re, value);
    });
    tinyMCE.get("previewMailContent").setContent(emailContent);
  }

  render() {
    let peopelLength = this.state.peopleList.length;
    let currentPerson = this.state.displayPerson;
    let leftStyle = {
      color: currentPerson > this.state.initCount ? "" : "#ebebeb"
    };
    let rightStyle = {
      color: currentPerson < peopelLength ? "" : "#ebebeb"
    };
    return (
      <div id="previewCampaign" className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close" onClick={this.props.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            Email preview
            <span className="sub-head">( 1258 issues found )</span>
          </div>
        </div>
        <div className="preview-modal-content">
          <div className="col s12">
            <div className="modal-content">
              <div className="template-content">
                <div className="issue-slider">
                  <i className="mdi waves-effect mdi-chevron-left left blue-txt"
                    onClick={this.slider.bind(this, "left")}
                    style={leftStyle}></i>
                  <span className="pagination">
                    Showing
                    <input type="text" value={this.state.displayPerson}
                      onChange={this.handleChange("displayPerson")}
                      onBlur={this.handleBlur} />
                    of {peopelLength}
                  </span>
                  <i className="mdi waves-effect mdi-chevron-right right blue-txt"
                    onClick={this.slider.bind(this, "right")}
                    style={rightStyle}></i>
                </div>
                <div className="input-field">
                  <input placeholder="subject" type="text"
                    className="field-name"
                    value={this.state.emailSubject}
                    id="emailSubject"
                    onChange={this.handleChange("emailSubject")} />
                  <label className="active" htmlFor="subject">
                    Subject
                  </label>
                </div>
                <div className="tiny-toolbar" id="previewToolbar"></div>
                <div id="previewMailContent" className="email-body" ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer r-btn-container">
          <input type="button"
            className="btn red p-1-btn"
            onClick={this.props.closeModal}
            value="Cancel" />
          <input type="button"
            className="btn blue modal-action" value="Save Changes" />
        </div>
      </div>
    );
  }
}

export default PreviewCampaignPopup;
