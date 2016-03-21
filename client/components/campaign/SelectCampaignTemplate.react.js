import React from "react";

class AddFollowupsCount extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      followups: this.props.followups
    };
  }

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
      innerTabIndex: 1,
      followups0: 0,
      followups1: 1,
      followups2: 2,
      followups3: 3,
      followups4: 4,
      followups5: 5,
    };
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    let followups0 = {
      width: "100%"
    };
    let followups2 = {
      width: "80%"
    };
    let followups3 = {
      width: "70%"
    };
    return (
      <div className="row" style={{display: isDisplay}}>
        <div className="col s12 m6 l6">
          <CampaignInfo />
          <div className="card template-preview">
            <div style={followups3} className="campaign-template">
              <div className="card-title">Blank Template</div>
              <div className="card-content">
                Hi,
                  <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
              </div>
              <div className="card-action">
                <i className="mdi mdi-eye"></i> Preview
              </div>
            </div>
            <AddFollowupsCount followups={this.state.followups5}/>
          </div>
        </div>
        <div className="col s12 m6 l6">
          <CampaignInfo />
          <div className="card template-preview">
            <div style={followups2} className="campaign-template">
              <div className="card-title">Blank Template</div>
              <div className="card-content">
                Hi,
                  <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
              </div>
              <div className="card-action">
                <i className="mdi mdi-eye"></i> Preview
              </div>
            </div>
            <AddFollowupsCount followups={this.state.followups2}/>
          </div>
        </div>
        <div className="col s12 m6 l6">
          <CampaignInfo />
          <div className="card template-preview">
            <div style={followups3} className="campaign-template">
              <div className="card-title">Blank Template</div>
              <div className="card-content">
                Hi,
                  <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
              </div>
              <div className="card-action">
                <i className="mdi mdi-eye"></i> Preview
              </div>
            </div>
            <AddFollowupsCount followups={this.state.followups4}/>
          </div>
        </div>
        <div className="col s12 m6 l6">
          <CampaignInfo />
          <div className="card template-preview">
            <div style={followups3} className="campaign-template">
              <div className="card-title">Blank Template</div>
              <div className="card-content">
                Hi,
                  <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
              </div>
              <div className="card-action">
                <i className="mdi mdi-eye"></i> Preview
              </div>
            </div>
            <AddFollowupsCount followups={this.state.followups3}/>
          </div>
        </div>
        <div className="col s12 m6 l6">
          <CampaignInfo />
          <div className="card template-preview">
            <div style={followups0} className="campaign-template">
              <div className="card-title">Blank Template</div>
              <div className="card-content">
                Hi,
                  <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
              </div>
              <div className="card-action">
                <i className="mdi mdi-eye"></i> Preview
              </div>
            </div>
            <AddFollowupsCount followups={this.state.followups0}/>
          </div>
        </div>
        <div className="col s12 m6 l6">
          <CampaignInfo />
          <div className="card template-preview">
            <div style={followups2} className="campaign-template">
              <div className="card-title">Blank Template</div>
              <div className="card-content">
                Hi,
                  <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
              </div>
              <div className="card-action">
                <i className="mdi mdi-eye"></i> Preview
              </div>
            </div>
            <AddFollowupsCount followups={this.state.followups1}/>
          </div>
        </div>

      </div>
    );
  }
}

export default SelectCampaignTemplate;
