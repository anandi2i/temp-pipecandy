import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import update from "react-addons-update";
import CampaignStore from "../../stores/CampaignStore";

class CampaignIssuesPreviewPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: guid(),
      personIssues: this.props.personIssues,
      emailSubject: this.props.emailSubject,
      peopleList: this.props.peopleList,
      issuesCompletedList: [],
      missingTagLen: [],
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1,
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  openModal = () => {
    let {id} = this.state;
    let {personIssues, emailSubject, peopleList, emailContent} = this.props;
    this.setState({
      personIssues: personIssues,
      emailSubject: emailSubject,
      peopleList: peopleList,
      emailContent: emailContent,
      issuesCompletedList: [],
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1,
    }, () => {
      this.el.openModal({
        dismissible: false
      });
      initTinyMCEPopUp(`#previewMailContent-${id}`, `#previewToolbar-${id}`,
        this.setEmailContent);
      this.el.find(".preview-modal-content").mCustomScrollbar({
        theme:"minimal-dark"
      });
    });
  }

  closeModal = () => {
    this.el.closeModal();
    tinyMCE.execCommand("mceRemoveEditor", true,
      `previewMailContent-${this.state.id}`);
    this.props.closeCallback(this.state.issuesCompletedList);
  }

  setEmailContent = () => {
    let {id, selectedPerson} = this.state;
    let {emailContent} = this.props;
    if(emailContent) {
      tinyMCE.get(`previewMailContent-${id}`).setContent(emailContent);
      this.applySmartTags(selectedPerson);
    }
  }

  onChange(e, field) {
    let state = {};
    if(field === "displayPerson") {
      state[field] = parseInt(e.target.value, 10) || "";
    } else {
      state[field] = e.target.value;
    }
    this.setState(state);
  }

  handleBlur = () => {
    let {initCount, displayPerson, personIssues} = this.state;
    if(displayPerson >= initCount && displayPerson <= personIssues.length) {
      this.applySmartTags(displayPerson - initCount);
    } else {
      this.setState({
        displayPerson: parseInt(initCount, 10)
      });
      this.loadFirstPerson;
    }
  }

  loadFirstPerson = () => {
    let firstPerson = 0;
    this.applySmartTags(firstPerson);
  }

  slider(position) {
    let id = this.state.selectedPerson;
    let {initCount, displayPerson, personIssues} = this.state;
    let peopleLength = personIssues.length;
    if(position === "left" && id >= initCount) {
      id -= initCount;
      this.setState({
        displayPerson: displayPerson - initCount
      });
      this.applySmartTags(id);
    }
    if(position === "right" && id < --peopleLength) {
      id += initCount;
      this.setState({
        displayPerson: displayPerson + initCount
      });
      this.applySmartTags(id);
    }
  }

  applySmartTags(personId) {
    let getPersonInfo = this.state.personIssues[personId];
    this.setState({
      selectedPerson: personId
    });
    let emailContent = this.props.emailContent.replace(/"/g, "'");
    emailContent = this.applySmartTagsValue(emailContent, getPersonInfo);
    tinyMCE.get(`previewMailContent-${this.state.id}`).setContent(emailContent);
  }

  replaceSmartTagContent(val, key) {
    let tag = "<span class='tag common' "+
      "contenteditable='false' data-tag='"+key+
      "' data-tag-name='"+val+"'>"+val+"</span>";
    return tag;
  }

  applySmartTagsValue(emailContent, getPersonInfo) {
    _.each(getPersonInfo, $.proxy(function (value, key) {
      if(key === "fields") {
        _.each(value, $.proxy(function (val, key) {
          let fieldsStr = "<span class='tag un-common' "+
            "contenteditable='false' data-tag='"+val.name+"' data-tag-name='"+
            val.name+"'>&lt;"+val.name+"&gt;</span>";
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

  saveSinglePerson = () => {
    let {id, initCount, personIssues, displayPerson} = this.state;
    let index = displayPerson - initCount;
    let getPersonInfo = _.clone(personIssues[index]);
    let currentContent = tinyMCE.get(`previewMailContent-${id}`).getContent();
    let getIssueTags = getIssueTagsInEditor(currentContent);
    if(getIssueTags.length) {
      console.log("Please remove all error tags to save changes");
    } else {
      let myList = [];
      getPersonInfo.template = currentContent;
      getPersonInfo.emailSubject = this.state.emailSubject;
      myList.push(getPersonInfo);
      personIssues.splice(index, initCount);
      this.setState((state) => ({
        issuesCompletedList: update(state.issuesCompletedList,
          {$push: myList}),
      }), () => {
        if(personIssues.length - initCount) {
          this.setState((state) => ({
            displayPerson: initCount
          }), () => {
            this.applySmartTags(displayPerson);
          });
        } else {
          this.applySmartTags(displayPerson);
        }
      });
    }
  }

  applyAllPerson = () => {
    let {id, initCount, personIssues, displayPerson, emailSubject} = this.state;
    let currentContent = tinyMCE.get(`previewMailContent-${id}`).getContent();
    currentContent = CampaignStore.constructEmailTemplate(currentContent);
    let getIssueTags = getIssueTagsInEditor(currentContent);
    let currentPerson = personIssues[displayPerson - initCount];
    let currentIssueTags = this.checkSmartTags(currentPerson);
    if(!getIssueTags.length) {
      let myList = [];
      let fixedPeopleId = [];
      _.each(personIssues, $.proxy(function(person, key) {
        let getPersonInfo = _.clone(person);
        let findIssues = this.checkSmartTags(getPersonInfo);
        let isMatch = _.all(currentIssueTags.issuesTags,
          function(v) { return _.include(findIssues.issuesTags, v); });
        if(isMatch && getPersonInfo) {
          getPersonInfo.template = currentContent;
          getPersonInfo.emailSubject = emailSubject;
          myList.push(getPersonInfo);
          fixedPeopleId.push(getPersonInfo.id);
        }
      }), this);

      _.each(fixedPeopleId, (val, key) => {
        personIssues.splice(personIssues.indexOf(val), initCount);
      });

      this.setState((state) => ({
        issuesCompletedList: update(state.issuesCompletedList,
          {$push: myList}),
        displayPerson: initCount
      }), () => {
        this.loadFirstPerson;
      });
    }
  }

  checkSmartTags(getPersonInfo) {
    let getEmailContent = this.props.emailContent;
    getEmailContent = getEmailContent.replace(/\"/g, "\'");
    let applyTags = this.applySmartTagsValue(getEmailContent, getPersonInfo);
    applyTags = CampaignStore.constructEmailTemplate(applyTags);
    let issuesTags = getIssueTagsInEditor(applyTags);
    return {
      "applySmartTags": applyTags,
      "issuesTags": issuesTags
    };
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
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            Email preview
            <span className="sub-head">( {this.state.personIssues.length} issues found )</span>
          </div>
          <div className="preview-slider">
            <i className="mdi waves-effect mdi-chevron-left left blue-txt"
              onClick={() => this.slider("left")}
              style={leftStyle}></i>
            <span className="pagination">
              Showing
              <input type="text" value={this.state.displayPerson}
                onChange={(e) => this.onChange(e, "displayPerson")}
                onBlur={this.handleBlur} />
              of {peopelLength}
            </span>
            <i className="mdi waves-effect mdi-chevron-right right blue-txt"
              onClick={() => this.slider("right")}
              style={rightStyle}></i>
          </div>
        </div>
        <div className="preview-modal-content">
          <div className="col s12">
            <div className="modal-content">
              <div className="template-content">
                <div className="input-field">
                  <input placeholder="subject" type="text"
                    className="field-name"
                    value={this.state.emailSubject}
                    id="emailSubject"
                    onChange={(e) => this.onChange(e, "emailSubject")} />
                  <label className="active" htmlFor="subject">
                    Subject
                  </label>
                </div>
                <div id={`previewToolbar-${this.state.id}`}
                  className="tiny-toolbar"></div>
                <div id={`previewMailContent-${this.state.id}`}
                  className="email-body"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer r-btn-container">
          <input type="button"
            className="btn red p-1-btn"
            onClick={this.closeModal}
            value="Cancel" />
          <input type="button"
            className="btn blue modal-action"
            onClick={this.saveSinglePerson}
            value="Apply" />
          <input type="button"
            className="btn blue modal-action"
            onClick={this.applyAllPerson}
            value="Apply To All" />
        </div>
      </div>
    );
  }
}

export default CampaignIssuesPreviewPopup;
