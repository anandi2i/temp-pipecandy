import React from "react";
import SelectPreBuildTemplate from "./SelectPreBuildTemplate.react";
import SelectCampaignTemplate from "./SelectCampaignTemplate.react";

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

class SelectEmailTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      index: 2,
      activeTab: 0
    };
  }

  handleClick = (index) => {
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
              <TabsNav handleClick={this.handleClick} active={this.state.activeTab}/>
              <ul className="right">
              <a href="#!" className="btn blue">Save & continue</a>
              </ul>
            </div>
          </nav>
        </div>
        <SelectPreBuildTemplate
          setTemplateContent={this.props.setTemplateContent}
          ref="selectPreBuildTemplate"
          active={this.state.activeTab} />
        <SelectCampaignTemplate active={this.state.activeTab} />
      </div>
    );
  }
}

export default SelectEmailTemplate;
