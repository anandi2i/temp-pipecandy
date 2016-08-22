import React from "react";
import ReactDOM from "react-dom";
import {SuccessMessages} from "../../utils/UserAlerts";

class AddFollowupsCount extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      followups: this.props.followups
    };
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    let indents = [];
    let followupsWidth;
    let minFollowup = 0;
    let maxFollowup = 3;
    let cardWidth = 100;
    if(this.state.followups === minFollowup){
      followupsWidth = "0%";
    } else if (this.state.followups < maxFollowup){
      followupsWidth = "20%";
    } else {
      followupsWidth = "30%";
    }
    let divStyle = {
      width: (cardWidth / this.state.followups) + "%"
    };
    let followupWidthStyle = {
      width: followupsWidth,
      display: this.state.followups === minFollowup ? "none" : "inline-block"
    };
    for (let i = 0; i < this.state.followups; i++) {
      indents.push(
        <div style={divStyle} className="followups" key={i}>
          <div className="head"></div>
          <div className="body"></div>
          <div className="preview"></div>
        </div>
      );
    }
    return(
      <div style={followupWidthStyle} className="campaign-followups">
        <div style={followupWidthStyle} className="count">
          <h2>{this.state.followups}</h2>Follow ups
        </div>
        {indents}
      </div>
    );
  }
}

class CampaignInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state={};
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    return(
      <div className="campaign-template-info">
        <div className="title">Could reachouts to SoCal CIOs Feb 2014</div>
        <div className="details">
          Sent on 23 Nov 2014<i className="mdi mdi-record"></i>
          Open rate 99%<i className="mdi mdi-record"></i>
          Click rate 50%
        </div>
      </div>
    );
  }
}

class SelectCampaignTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      innerTabIndex: 2,
      template: {
        content: "Hi <br /><br /> You had downloaded our report on the current \
          app development economy and pricing standards. I hope the report was \
          useful. <br /><br />  As a marketplace that identifies and aggregates\
          information about over 10000 web &amp; mobile development agencies,\
          ContractIQ had this data all along. So, we went ahead and published \
          the first benchmark of it\'s kind. <br /><br /> How about a quick \
          call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />",
        name: "Blank Template"
      },
      followups: [
        {
          key: "followups0",
          value: 0,
          divStyle: {
            width: "100%"
          }
        },
        {
          key: "followups1",
          value: 1,
          divStyle: {
            width: "80%"
          }
        },
        {
          key: "followups2",
          value: 2,
          divStyle: {
            width: "80%"
          }
        },
        {
          key: "followups3",
          value: 3,
          divStyle: {
            width: "70%"
          }
        },
        {
          key: "followups4",
          value: 4,
          divStyle: {
            width: "70%"
          }
        },
        {
          key: "followups5",
          value: 5,
          divStyle: {
            width: "70%"
          }
        },
      ]
    };
  }

  /**
   * Initiate lean modal and mCustomScrollbar
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".modal-trigger").leanModal({
      dismissible: false
    });
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * selectTemplate function to show selected template msg
   * @param {string} templateName Name of the selected template
   */
  selectTemplate(templateName) {
    displaySuccess(SuccessMessages.successSelectTemplate
      .replace("$selectedTemplate", `<strong>${templateName}</strong>`));
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    return (
      <div className="row" style={{display: isDisplay}}>
        {
          this.state.followups.map(function (followup) {
            return (
              <div className="col s12 m6 l6" key={followup.value}>
                <CampaignInfo />
                <div className="card template-preview">
                  <div onClick={() => this.selectTemplate(this.state.template.name)}>
                    <div style={followup.divStyle} className="campaign-template">
                      <div className="card-title">{this.state.template.name}</div>
                      <div className="card-content">
                        <div dangerouslySetInnerHTML={{__html: this.state.template.content}} />
                      </div>
                      {
                        <div className="card-action modal-trigger"
                          href="#previewModal">
                          <i className="mdi mdi-eye"></i> Preview
                        </div>
                      }
                    </div>
                    <AddFollowupsCount followups={followup.value}/>
                  </div>
                </div>
              </div>
            );
          }, this)
        }
        <div id="previewModal" className="modal modal-fixed-header modal-fixed-footer">
          <i className="mdi mdi-close modal-close"></i>
          <div className="modal-header">
            <div className="head">{this.state.template.name}</div>
          </div>
          <div className="modal-content">
            <div className="template-content gray-bg p-10">
              <div className="card-content">
                <div dangerouslySetInnerHTML={{__html: this.state.template.content}} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <div className="btn-container">
              <input type="button" value="Cancel"
                className="btn red modal-action modal-close" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SelectCampaignTemplate;
