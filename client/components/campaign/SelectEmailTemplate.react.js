import React from "react";
import ReactDOM from "react-dom";
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
      /* TODO Remove this tab for the 1.0 version
      {
        name: "Pick from my earlier emails",
      } */
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

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".tooltipped").tooltip({delay: 50});
  }

  componentWillUnmount() {
    removeMaterialTooltip();
  }

  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  render() {
    const scheduleEmailIndex = 3;
    const emailListIndex = 1;
    return (
      <div className="container">
        <div className="row sub-head-container">
          <div className="head col s12 m10 l10">Start drafting your email(s)</div>
          <div className="col s12 m2 l2 p-0">
            <a className="btn arrow-btn right tooltipped"
              data-position="left"
              data-tooltip="Select Email List(s)"
              onClick={() => this.props.handleClick(emailListIndex)} >
              <i className="mdi mdi-chevron-left"></i>
            </a>
          </div>
          <div className="sub-head">
            <a className="btn blue" onClick={() => this.props.handleClick(scheduleEmailIndex)}>Save & continue</a>
          </div>
        </div>
        <div className="row inner-tabs">
          <nav>
            <div className="nav-wrapper">
              <TabsNav handleClick={this.handleClick} active={this.state.activeTab}/>
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
