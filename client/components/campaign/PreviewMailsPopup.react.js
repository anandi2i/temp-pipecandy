import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import CampaignStore from "../../stores/CampaignStore";

class PreviewMailsPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initCount: 1,
      displayPerson: 1,
      selectedPerson: 0,
      peopleList: this.props.peopleList || [],
      listofEmails: [],
      followupsList:[]
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  openModal = () => {
    let {
      peopleList,
      emailSubject,
      emailContent,
      mainEmailContent,
      followupsEmailContent
    } = this.props;
    this.setState({
      peopleList: peopleList,
      emailContent: emailContent,
      emailSubject: emailSubject,
      mainEmailContent: mainEmailContent,
      followupsEmailContent: followupsEmailContent
    }, () => {
      this.el.openModal({
        dismissible: false
      });
      this.applyEmailTemplates(this.state.initCount);
    });
    this.el.find(".preview-modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  onChange(event, field) {
    let state = {};
    if(field === "displayPerson") {
      state[field] = parseInt(event.target.value, 10) || "";
    } else {
      state[field] = event.target.value;
    }
    this.setState(state);
  }

  handleBlur = () => {
    let {initCount, displayPerson, peopleList} = this.state;
    if(displayPerson >= initCount && displayPerson <= peopleList.length) {
        this.applyEmailTemplates(displayPerson);
    } else {
      this.setState({
        displayPerson: parseInt(initCount, 10)
      });
      this.applyEmailTemplates(initCount);
    }
  }

  slider(position) {
    let {peopleList, initCount, displayPerson} = this.state;
    let peopleLength = peopleList.length;
    if(position === "left" && displayPerson > initCount) {
      this.setState({
        displayPerson: displayPerson - initCount
      }, () => {
        this.applyEmailTemplates(this.state.displayPerson);
      });
    }
    if(position === "right" && displayPerson < peopleLength) {
      this.setState({
        displayPerson: displayPerson + initCount
      }, () => {
        this.applyEmailTemplates(this.state.displayPerson);
      });
    }
  }

  applyEmailTemplates(id) {
    let currentPerson = this.state.peopleList[--id];
    let content, emailSubject;
    let issueCompletedList = this.state.mainEmailContent.issuesCompletedList;
    let findPerson = _.find(issueCompletedList,
      user => user.id === currentPerson.id);
    if(findPerson) {
      content = findPerson.template;
      emailSubject = findPerson.emailSubject;
    } else {
      content = this.state.emailContent;
      emailSubject = this.state.emailSubject;
    }
    let setContent =
      CampaignStore.applySmartTagsValue(content, currentPerson);

    this.setState({
      listofEmails: [{
        "content": setContent,
        "emailSubject": emailSubject
      }]
    });

    let followupsList =[], followupEmail, followupSubject;
    this.state.followupsEmailContent.map(followup => {
      let findFollowups = _.filter(followup.issuesCompletedList, user => {
        return user.id === currentPerson.id;
      });
      if(findFollowups.length) {
        followupEmail = findFollowups[0].template;
        followupSubject = findFollowups[0].emailSubject;
      } else {
        followupEmail = followup.emailContent;
        followupSubject = followup.emailSubject;
      }
      let followupContent =
        CampaignStore.applySmartTagsValue(followupEmail, currentPerson);
      followupsList.push({
        "content": followupContent,
        "emailSubject": followupSubject
      });
    });

    this.setState({
      followupsList: followupsList
    });
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
        <i className="mdi mdi-close modal-close"></i>
        <div className="modal-header">
          <div className="head">
            Email preview
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
                <div>
                  {
                    this.state.listofEmails.map(function(a, key) {
                      return (
                        <div key={key} className="preview-mail-container">
                          <div className="col s12 head">Subject</div>
                          <div className="col s12 content">{a.emailSubject}</div>
                          <div className="col s12 head">Email</div>
                          <div className="col s12 mail-content content" dangerouslySetInnerHTML={{__html: a.content}}></div>
                        </div>
                      );
                    })
                  }
                  {
                    this.state.followupsList.map(function(a, key) {
                      return (
                        <div key={key} className="preview-mail-container">
                          <div className="col s12 head">Subject</div>
                          <div className="col s12 content">{a.emailSubject}</div>
                          <div className="col s12 head">Email</div>
                          <div className="col s12 mail-content content" dangerouslySetInnerHTML={{__html: a.content}}></div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PreviewMailsPopup;
