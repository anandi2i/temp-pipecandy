import React from "react";
// import {Link} from "react-router";
import autobind from "autobind-decorator";
// import CampaignActions from "../../actions/CampaignActions";
// import CampaignStore from "../../stores/CampaignStore";

class TabsNav extends React.Component {
  handleClick(index) {
    this.props.handleClick(index);
  }

  render() {
    const _tabs = [
      {
        name: "Email Templates",
      },
      {
        name: "Pick from my earlier emails",
      }
    ];

    let li = _tabs.map((item, i) => {
      return (
        <li key={i}>
          <a onClick={this.handleClick.bind(this, i)} className={this.props.active === i ? "active" : {}}>
            {item.name}
          </a>
        </li>
      );
    });

    return (
      <ul className="left main-menu-link">
        {li}
      </ul>
    );
  }
}

class SelectDefaultTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      templates: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      innerTabIndex: 0
    };
  }

  componentDidMount() {
    $(".modal-trigger").leanModal();
  }

  @autobind
  closeModal() {
    $("#previewTemplate").closeModal();
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    return (
      <div className="row" style={{display: isDisplay}}>
        <div className="col s12 m6 l4">
          <div className="card template-preview">
            <div className="card-title">Blank Template</div>
            <div className="card-content">
              &nbsp;
            </div>
            <div className="card-action">
              <i className="mdi mdi-eye-off"></i> Preview
            </div>
          </div>
        </div>
        {
          this.state.templates.map($.proxy(function (value, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className="card template-preview">
                  <div className="card-title">Template- {key}</div>
                  <div className="card-content">
                    Hi,
                      <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
                  </div>
                  <div className="card-action modal-trigger" href="#previewTemplate">
                    <i className="mdi mdi-eye"></i> Preview
                  </div>
                </div>
              </div>
            );
          }, this))
        }
        {/* Email template preview modal popup starts here*/}
        <div id="previewTemplate" className="modal modal-fixed-header modal-fixed-footer">
          <div className="modal-header">
            <div className="head">Add Subbscriber</div>
            <i className="mdi mdi-close" onClick={this.closeModal}></i>
          </div>
          <div className="modal-content">
            <div className="template-content">
              Hi,
			    <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
            </div>
          </div>
          <div className="modal-footer r-btn-container">
            <input type="button" className="btn red modal-action modal-close p-1-btn" value="Cancel" />
            <input type="button" className="btn blue modal-action" value="Pick This Template" />
          </div>
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
    };
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    return (
      <div className="row" style={{display: isDisplay}}>
        <h4> Select Campaign Template </h4>
      </div>
    );
  }
}

class SelectEmailTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      index: 2,
      activeTab: 0
    };
  }

  handleClick(index) {
    this.setState({
      activeTab: index
    });
  }

  render() {
    return (
      <div className="container" style={{display: this.props.active === this.state.index ? "block" : "none"}}>
        <div className="row sub-head-container m-lr-0">
          <div className="head">Start drafting your email(s)</div>
        </div>
        <div className="row inner-tabs">
          <nav>
            <div className="nav-wrapper">
              <TabsNav handleClick={this.handleClick.bind(this)} active={this.state.activeTab}/>
              <ul className="right">
              <a href="#!" className="btn blue">Save & continue</a>
              </ul>
            </div>
          </nav>
        </div>
        <SelectDefaultTemplate active={this.state.activeTab} />
        <SelectCampaignTemplate active={this.state.activeTab} />
      </div>
    );
  }
}

export default SelectEmailTemplate;
