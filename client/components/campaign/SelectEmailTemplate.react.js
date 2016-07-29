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

    let li = _tabs.map((item, index) => {
      return (
        <li key={index}>
          <a onClick={() => this.handleClick(index)}
            className={this.props.active === index ? "active" : ""}>
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
      activeTab: 0
    };
  }

  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  render() {
    const scheduleEmailIndex = 3;
    return (
      <div className="container">
        <div className="row sub-head-container m-lr-0">
          <div className="head">Start drafting your email(s)</div>
        </div>
        <div className="row inner-tabs">
          <nav>
            <div className="nav-wrapper">
              <TabsNav handleClick={this.handleClick} active={this.state.activeTab}/>
              <ul className="right">
              <a className="btn blue" onClick={() => this.props.handleClick(scheduleEmailIndex)}>Save & continue</a>
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
