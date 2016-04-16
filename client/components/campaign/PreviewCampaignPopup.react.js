import React from "react";
import autobind from "autobind-decorator";
import _ from "underscore";
import update from "react-addons-update";

class PreviewCampaignPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      personIssues : this.props.personIssues,
      emailSubject: this.props.emailSubject,
      peopleList: this.props.peopleList,
	    issueCompletedPerson: [],
      missingTagLen: [],
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1,
      isApplyToall: false
    };
  }

  componentDidMount() {
    $("#previewCampaign").openModal({
      dismissible: false
    });
    if(!tinyMCE.get("previewMailContent")){
      initTinyMCEPopUp("#previewMailContent", "#previewToolbar",
        this.initTemplateLoade);
      $(".preview-modal-content").mCustomScrollbar({
        theme:"minimal-dark"
      });
    }
  }

  @autobind
  initTemplateLoade(){
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
      displayPerson <= this.state.personIssues.length) {
        this.applySmartTags(displayPerson - initCount);
      } else {
        this.setState({
          displayPerson: parseInt(initCount, 10)
        });
        this.loadFirstPerson();
      }
  }

  @autobind
  loadFirstPerson(){
    let firstPerson = 0;
    this.applySmartTags(firstPerson);
  }

  @autobind
  slider(position){
    let id = this.state.selectedPerson;
	  let initCount = this.state.initCount;
    let peopleLength = this.state.personIssues.length;
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
    let getPersonInfo = this.state.personIssues[personId];
    this.setState({
      selectedPerson: personId,
    });
    let emailContent = this.props.emailContent.replace(/"/g, "'");
    emailContent = this.applySmartTagsValue(emailContent, getPersonInfo);
    tinyMCE.get("previewMailContent").setContent(emailContent);
  }

  @autobind
  replaceSmartTagContent(val, key){
    let tag = "<span class='tag common' "+
      "contenteditable='false' data-tag='"+key+
      "' data-tag-name='"+val+"'>"+val+"</span>";
    return tag;
  }

  @autobind
  applySmartTagsValue(emailContent, getPersonInfo){
    _.each(getPersonInfo, $.proxy(function (value, key) {
      if(key === "fields"){
        _.each(value, $.proxy(function (val, key) {
          let fieldsStr = "<span class='tag un-common' "+
            "contenteditable='false' data-tag='"+val.name+"' data-tag-name='"+
            val.value+"'>&lt;"+val.name+"&gt;</span>";
          let re = new RegExp(fieldsStr, "g");
          emailContent = emailContent
            .replace(re, this.replaceSmartTagContent(val.value, val.name));
        }), this);
      }
      let str = "<span class='tag common' "+
        "contenteditable='false' data-tag='"+key+"' data-tag-name='"+
          key+"'>&lt;"+key+"&gt;</span>";
      let re = new RegExp(str, "g");
      emailContent = emailContent
        .replace(re, this.replaceSmartTagContent(value, key));
    }), this);
    return emailContent;
  }

  @autobind
  saveSinglePerson(){
    let initCount = this.state.initCount;
    let index = this.state.displayPerson - initCount;
    let getPersonInfo = this.state.personIssues[index];
    let currentContent = tinyMCE.get("previewMailContent").getContent();
    let getIssueTags = getIssueTagsInEditor(currentContent);
    if(getIssueTags.length) {
      console.log("Please remove all error tags to save changes");
    } else {
      getPersonInfo.template = currentContent;
      this.setState((state) => ({
        issueCompletedPerson: update(state.issueCompletedPerson,
          {$push: [getPersonInfo]}),
        personIssues: update(state.personIssues,
          {$splice: [[index, initCount]]})
      }), function(){
        if(this.state.personIssues.length - initCount){
          this.setContent("previewMailContent");
        } else {
          this.setState((state) => ({
            displayPerson: initCount
          }), function(){
            this.setContent("previewMailContent");
          });
        }
      });
    }
  }

  @autobind
  setContent(id){
    tinyMCE.get(id).setContent(this.props.emailContent);
    this.applySmartTags(this.state.displayPerson);
  }

  @autobind
  applyAllPerson(){
    let initCount = this.state.initCount;
    let currentContent = tinyMCE.get("previewMailContent").getContent();
    let getIssueTags = getIssueTagsInEditor(currentContent);
    let currentPerson = this.state.personIssues[this.state.displayPerson -
      initCount];
    let currentIssueTags = this.checkSmartTags(currentPerson);
    if(!getIssueTags.length) {
      let people = this.state.personIssues;
      let myList = [];
      let fixedPeopleId = [];
      _.each(people, $.proxy(function(getPersonInfo, key){
        let findIssues = this.checkSmartTags(getPersonInfo);
        let isMatch = _.all(currentIssueTags.issuesTags,
          function(v){ return _.include(findIssues.issuesTags, v); });
        if(isMatch && getPersonInfo){
          getPersonInfo.template = findIssues.applySmartTags;
          myList.push(getPersonInfo);
          fixedPeopleId.push(getPersonInfo.id);
        }
      }), this);

      _.each(fixedPeopleId, function(val, key){
        people.splice(people.indexOf(val), initCount);
      });

      this.setState((state) => ({
        issueCompletedPerson: update(state.issueCompletedPerson,
          {$push: myList}),
        displayPerson: initCount
      }), function(){
        this.loadFirstPerson();
      });
    }
  }

  @autobind
  checkSmartTags(getPersonInfo){
    let getEmailContent = this.props.emailContent;
    getEmailContent = getEmailContent.replace(/\"/g, "\'");
    let applyTags = this.applySmartTagsValue(getEmailContent, getPersonInfo);
    applyTags = constructEmailTemplate(applyTags);
    let issuesTags = getIssueTagsInEditor(applyTags);
    return {
      "applySmartTags": applyTags,
      "issuesTags": issuesTags
    };
  }

  @autobind
  saveIssues() {
    this.state.isApplyToall ? this.applyAllPerson() : this.saveSinglePerson();
  }

  @autobind
  applyToAll(){
    this.setState((state) => ({
      isApplyToall: !this.state.isApplyToall
    }));
  }

  render() {
    let peopelLength = this.state.personIssues.length;
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
            <span className="sub-head">( {this.state.personIssues.length} issues found )</span>
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
          <span className="left apply-all">
            <input type="checkbox" className="filled-in" id="applyToAll" onClick={this.applyToAll}/>
            <label htmlFor="applyToAll">Apply to all</label>
          </span>
          <input type="button"
              className="btn red p-1-btn"
              onClick={this.props.closeModal}
              value="Cancel" />
            <input type="button"
              className="btn blue modal-action"
              onClick={this.saveIssues.bind(this)}
              value="Save Changes" />
        </div>
      </div>
    );
  }
}

export default PreviewCampaignPopup;
