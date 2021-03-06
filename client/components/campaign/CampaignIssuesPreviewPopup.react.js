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
      emailContent: this.props.emailContent,
      peopleList: this.props.peopleList,
      issuesCompletedList: [],
      previewIssuesCompleted: [],
      missingTagLen: [],
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1,
      firstPerson: 0
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
      previewIssuesCompleted: [],
      selectedPerson: 0,
      displayPerson: 1,
      initCount: 1
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
    this.props.closeCallback();
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
      }, () => {
        this.applyAllSmartTags(this.state.firstPerson);
      });
    }
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

  applySinglePerson = () => {
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
      let previewList = [];
      issuePerson.subject = getSubject.content;
      issuePerson.content = getContent.content;
      issuePerson.personId = getPersonInfo.id;
      previewList.push(issuePerson);
      issuePerson.usedTagIds = this.state.usedTagIds;
      issuePerson.userId = getCookie("userId");
      myList.push(issuePerson);
      personIssues.splice(index, initCount);
      this.setState((state) => ({
        issuesCompletedList: update(state.issuesCompletedList,
          {$push: myList}),
        previewIssuesCompleted: update(state.previewIssuesCompleted,
          {$push: previewList}),
        displayPerson: initCount
      }), () => {
        this.loadFirstPerson();
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
      let {
        initCount,
        personIssues,
        displayPerson,
        usedTagIdsArr
      } = this.state;
      let currentPerson = personIssues[displayPerson - initCount];
      let currentIssueTags = this.checkSmartTags(currentPerson);
      let myList = [];
      let fixedPeopleId = [];
      let count = true;
      let previewList = [];
      let issuePerson = {};
      let allUsedTagIds = _.sortBy(usedTagIdsArr, (val) => { return val; });
      let campaignSub =
        CampaignStore.constructEmailTemplate(getSubject.content);
      let campaignEmail =
        CampaignStore.constructEmailTemplate(getContent.content);
      _.each(personIssues, $.proxy(function(person, key) {
        let getPersonInfo = _.clone(person);
        let findIssues = this.checkSmartTags(getPersonInfo);
        let isMatch = currentIssueTags.issuesTags.equals(findIssues.issuesTags);
        if(isMatch && getPersonInfo) {
          if(count) {
            issuePerson.subject = campaignSub;
            issuePerson.content = campaignEmail;
            let getUsedTagIds = CampaignStore.usedTagIds(issuePerson.subject
              .concat(issuePerson.content));
            issuePerson.usedTagIds = getUsedTagIds.usedTagIds;
            issuePerson.missingTagIds = _.difference(allUsedTagIds,
              getUsedTagIds.usedTagIdsArr).join().replace(/,/g, "|");
            issuePerson.userId = getCookie("userId");
            myList.push(issuePerson);
          }
          previewList.push({
            subject: campaignSub,
            content: campaignEmail,
            personId: getPersonInfo.id
          });
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
        previewIssuesCompleted: update(state.previewIssuesCompleted,
          {$push: previewList}),
        displayPerson: initCount
      }), () => {
        this.loadFirstPerson();
      });
    }
  }

  /**
   * Loade first person after apply smart tags
   * Close model popup after all issues solved
   */
  loadFirstPerson = () => {
    if(this.state.personIssues.length){
      this.applyAllSmartTags(this.state.firstPerson);
    } else {
      this.closeModal();
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
    let {personIssues, displayPerson, initCount, emailSubject, id} = this.state;
    let peopelLength = personIssues.length;
    let currentPerson = displayPerson;
    let leftStyle = {
      color: currentPerson > initCount ? "" : "#ebebeb"
    };
    let rightStyle = {
      color: currentPerson < peopelLength ? "" : "#ebebeb"
    };
    let subjectClass = emailSubject
      ? "email-issue-subject" : "empty-email-issue-subject";
    return (
      <div id="previewCampaign" className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            Email Preview
            <span className="sub-head">( {peopelLength} issue(s) found )</span>
          </div>
          <div className="preview-slider">
            <i className="mdi waves-effect mdi-chevron-left left blue-txt"
              onClick={() => this.slider("left")}
              style={leftStyle}></i>
            <span className="pagination">
              Showing
              <input type="text" value={displayPerson}
                onChange={(e) => this.onChange(e, "displayPerson")}
                onBlur={this.handleBlur} />
              of
              <input disabled type="text" value={peopelLength} />
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
                { peopelLength
                  ? <div className="email-issue-to">To
                    <span className="chip">{`<${personIssues[currentPerson - initCount].email}>`}</span>
                    </div>
                  : ""
                }
                <div id={`previewSubContent-${id}`}
                  className={subjectClass}></div>
                <div id={`previewToolbar-${id}`}
                  className="tiny-toolbar"></div>
                <div id={`previewMailContent-${id}`}
                  className="email-body issue-container"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="btn-container">
            <input type="button"
              className="btn red"
              onClick={this.closeModal}
              value="Cancel" />
            <input type="button"
              className="btn blue modal-action"
              onClick={this.applySinglePerson}
              value="Apply" />
            <input type="button"
              className="btn blue modal-action"
              onClick={this.applyAllPerson}
              value="Apply To All" />
          </div>
        </div>
      </div>
    );
  }
}

export default CampaignIssuesPreviewPopup;
