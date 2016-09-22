import React from "react";
import ReactDOM from "react-dom";
import SelectPreBuildTemplate from "./SelectPreBuildTemplate.react";
// import SelectCampaignTemplate from "./SelectCampaignTemplate.react";
import SelectMyTemplate from "./SelectMyTemplate.react";

class TabsNav extends React.Component {
  handleClick(index) {
    this.props.handleClick(index);
  }

  render() {
    const _tabs = [
      {
        name: "Email Templates"
      },
      {
        name: "My Templates"
      }
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
        <div className="row sub-head-container run-campaign-nav-wrapper">
          <div className="head col s12 m10 l10">Start drafting your email(s)</div>

          <div className="sub-head">
            <a className="btn blue right"
              onClick={() => this.props.handleClick(scheduleEmailIndex)}>
              Save & continue
            </a>
            <a className="right arrow-btn btn"
              onClick={() => this.props.handleClick(emailListIndex)}>
              <i className="mdi mdi-chevron-left left"></i> Select Email List(s)
            </a>
          </div>
        </div>
        <div className="row inner-tabs">
          <nav>
            <div className="nav-wrapper">
              <TabsNav refs="emailSelectTabs" handleClick={this.handleClick} active={this.state.activeTab}/>
            </div>
          </nav>
        </div>
        <SelectPreBuildTemplate
          setTemplate={this.props.setTemplate}
          ref="selectPreBuildTemplate"
          active={this.state.activeTab} />
        <SelectMyTemplate
          setTemplate={this.props.setTemplate}
          ref="SelectMyTemplate"
          active={this.state.activeTab} />
        {/* <SelectCampaignTemplate active={this.state.activeTab} /> */}
      </div>
    );
  }
}

export default SelectEmailTemplate;
