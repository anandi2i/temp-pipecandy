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
    let {
      personIssues,
      emailSubject,
      peopleList,
      emailContent,
      allFields
    } = this.props;
    this.setState({
      personIssues: personIssues,
      emailSubject: emailSubject,
      peopleList: peopleList,
      emailContent: emailContent,
      allFields: allFields,
      issuesCompletedList: [],
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1,
    }, () => {
      this.el.openModal({
        dismissible: false
      });
      let {emailSubject, emailContent} = this.state;
      let getUsedTagIds = CampaignStore.usedTagIds(
        emailSubject.concat(emailContent));
      this.setState({
        usedTagIds: getUsedTagIds.usedTagIds,
        usedTagIdsArr: getUsedTagIds.usedTagIdsArr
      });
      initTinyMCEPopUp(`#previewMailContent-${id}`, `#previewToolbar-${id}`,
        true, this.setEmailContent);
      initTinyMCEPopUp(`#previewSubContent-${id}`, "",
        false, this.setEmailSubject);
      this.el.find(".preview-modal-content").mCustomScrollbar({
        theme:"minimal-dark"
      });
    });
  }

  closeModal = () => {
    this.el.closeModal();
    tinyMCE.execCommand("mceRemoveEditor", true,
      `previewMailContent-${this.state.id}`);
    tinyMCE.execCommand("mceRemoveEditor", true,
      `previewSubContent-${this.state.id}`);
    this.props.closeCallback(this.state.issuesCompletedList);
  }

  setEmailContent = () => {
    let {selectedPerson} = this.state;
    let {emailContent} = this.props;
    if(emailContent) {
      this.applySmartTags(selectedPerson, emailContent, "previewMailContent");
    }
  }

  setEmailSubject = () => {
    let {selectedPerson} = this.state;
    let {emailSubject} = this.props;
    if(emailSubject) {
      this.applySmartTags(selectedPerson, emailSubject, "previewSubContent");
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
      this.applyAllSmartTags(displayPerson - initCount);
    } else {
      this.setState({
        displayPerson: parseInt(initCount, 10)
      });
      this.loadFirstPerson;
    }
  }

  loadFirstPerson = () => {
    let firstPerson = 0;
    this.applyAllSmartTags(firstPerson);
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
      this.applyAllSmartTags(id);
    }
    if(position === "right" && id < --peopleLength) {
      id += initCount;
      this.setState({
        displayPerson: displayPerson + initCount
      });
      this.applyAllSmartTags(id);
    }
  }

  applyAllSmartTags(personId) {
    this.applySmartTags(personId, this.props.emailContent,
      "previewMailContent");
    this.applySmartTags(personId, this.props.emailSubject,
      "previewSubContent");
  }

  applySmartTags(personId, tagContent, editorId) {
    let getPersonInfo = this.state.personIssues[personId];
    this.setState({
      selectedPerson: personId
    });
    let content = CampaignStore.applySmartTagsValue(tagContent, getPersonInfo);
    tinyMCE.get(`${editorId}-${this.state.id}`).setContent(content);
  }

  checkIssueTags(editorId){
    let getContent = tinyMCE.get(`${editorId}-${this.state.id}`).getContent();
    return {
      "issueTags": getIssueTagsInEditor(getContent),
      "content": getContent
    };
  }

  saveSinglePerson = () => {
    let getContent = this.checkIssueTags("previewMailContent");
    let getSubject = this.checkIssueTags("previewSubContent");
    if(getContent.issueTags.length || getSubject.issueTags.length) {
      displayError("Please remove all error tags to save changes");
      console.log("Please remove all error tags to save changes");
    } else {
      let {initCount, personIssues, displayPerson} = this.state;
      let index = displayPerson - initCount;
      let getPersonInfo = _.clone(personIssues[index]);
      let myList = [];
      let issuePerson = {};
      issuePerson.subject = getSubject.content;
      issuePerson.content = getContent.content;
      issuePerson.personId = getPersonInfo.id;
      issuePerson.usedTagIds = this.state.usedTagIds;
      issuePerson.userId = getCookie("userId");
      myList.push(issuePerson);
      personIssues.splice(index, initCount);
      this.setState((state) => ({
        issuesCompletedList: update(state.issuesCompletedList,
          {$push: myList})
      }), () => {
        this.handleBlur();
      });
    }
  }

  applyAllPerson = () => {
    let getContent = this.checkIssueTags("previewMailContent");
    let getSubject = this.checkIssueTags("previewSubContent");
    if(getContent.issueTags.length || getSubject.issueTags.length) {
      displayError("Please remove all error tags to save changes");
      console.log("Please remove all error tags to save changes");
    } else {
      let {initCount, personIssues, displayPerson} = this.state;
      let currentPerson = personIssues[displayPerson - initCount];
      let currentIssueTags = this.checkSmartTags(currentPerson);
      let myList = [];
      let fixedPeopleId = [];
      let count = true;
      _.each(personIssues, $.proxy(function(person, key) {
        let getPersonInfo = _.clone(person);
        let findIssues = this.checkSmartTags(getPersonInfo);
        let isMatch = currentIssueTags.issuesTags.equals(findIssues.issuesTags);
        if(isMatch && getPersonInfo) {
          if(count) {
            let issuePerson = {};
            let subj = CampaignStore.constructEmailTemplate(getSubject.content);
            let mail = CampaignStore.constructEmailTemplate(getContent.content);
            let getUsedTagIds = CampaignStore.usedTagIds(subj.concat(mail));
            let missingTagIds = _.difference(this.state.usedTagIdsArr,
              getUsedTagIds.usedTagIdsArr).join().replace(/,/g, "|");
            issuePerson.subject = CampaignStore.applySmartTagsValue(
              subj, getPersonInfo);
            issuePerson.content = CampaignStore.applySmartTagsValue(
              mail, getPersonInfo);
            issuePerson.usedTagIds = getUsedTagIds.usedTagIds;
            issuePerson.missingTagIds = missingTagIds;
            issuePerson.userId = getCookie("userId");
            myList.push(issuePerson);
          }
          count = false;
          fixedPeopleId.push(getPersonInfo.id);
        }
      }), this);

      _.each(fixedPeopleId, (val, key) => {
        personIssues.splice(_.findIndex(personIssues, {id: val}), initCount);
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
    let getEmailContent =
      this.props.emailSubject.concat(this.props.emailContent);
    let applyTags =
      CampaignStore.applySmartTagsValue(getEmailContent, getPersonInfo);
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
    let subjectClass = this.state.emailSubject
      ? "email-issue-subject" : "empty-email-issue-subject";
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
                <div id={`previewSubContent-${this.state.id}`}
                  className={subjectClass}></div>
                <div id={`previewToolbar-${this.state.id}`}
                  className="tiny-toolbar"></div>
                <div id={`previewMailContent-${this.state.id}`}
                  className="email-body issue-container"></div>
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
