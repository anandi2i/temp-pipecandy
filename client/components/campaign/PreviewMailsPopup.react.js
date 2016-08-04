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
      listofEmails: {},
      followupsList:[]
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  openModal = () => {
    let getOptText = this.props.getOptText();
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
      followupsEmailContent: followupsEmailContent,
      isOptText: getOptText.isOptText,
      isAddress: getOptText.isAddress,
      optText: getOptText.optText,
      address: getOptText.address
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

  closeModal = () => {
    this.el.closeModal();
    this.props.closePreviewCallback();
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
    let optTextContent = "";
    let issueCompletedList = this.state.mainEmailContent;
    let findPerson = _.find(issueCompletedList,
      person => person.personId === currentPerson.id);

    //Get optional text content
    if(this.state.isOptText || this.state.isAddress){
      let optionalText = {
        optText: this.state.optText,
        address: this.state.address,
        isOptText: this.state.isOptText,
        isAddress: this.state.isAddress
      };
      optTextContent = CampaignStore.setOptText(optionalText);
    }
    if(findPerson) {
      content = findPerson.content;
      emailSubject = findPerson.subject;
    } else {
      content = this.state.emailContent;
      emailSubject = this.state.emailSubject;
    }
    let setContent =
      CampaignStore.applySmartTagsValue(content, currentPerson);
    // concat optTextContent content
    setContent = setContent.concat(optTextContent);
    let setSubject =
      CampaignStore.applySmartTagsValue(emailSubject, currentPerson);
    this.setState({
      listofEmails: {
        "content": setContent,
        "emailSubject": setSubject
      }
    });

    let followupsList =[], followupEmail;
    this.state.followupsEmailContent.map(followup => {
      let findFollowups = _.filter(followup.issueCompleted, person => {
        return person.personId === currentPerson.id;
      })[0];
      if(findFollowups) {
        followupEmail = findFollowups.content;
      } else {
        followupEmail = followup.emailContent;
      }
      let followupContent =
        CampaignStore.applySmartTagsValue(followupEmail, currentPerson);
      followupContent = followupContent.concat(optTextContent);
      followupsList.push({
        "content": followupContent
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
    let listofEmails = this.state.listofEmails;
    let rightStyle = {
      color: currentPerson < peopelLength ? "" : "#ebebeb"
    };
    return (
      <div id="previewCampaign" className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            Email Preview
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
                  <div className="preview-mail-container">
                    <div className="col s12 head">Subject</div>
                    <div className="col s12 content" dangerouslySetInnerHTML={{__html: listofEmails.emailSubject}} />
                    <div className="col s12 head">Email</div>
                    <div className="col s12 mail-content content" dangerouslySetInnerHTML={{__html: listofEmails.content}} />
                  </div>
                  {
                    this.state.followupsList.map(function(followup, key) {
                      return (
                        <div key={key} className="preview-mail-container">
                          <h3>Follow up {++key}</h3>
                          <div className="col s12 head">Email</div>
                          <div className="col s12 mail-content content" dangerouslySetInnerHTML={{__html: followup.content}} />
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
