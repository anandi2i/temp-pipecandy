import React from "react";
import autobind from "autobind-decorator";
import SelectEmailTemplate from "./SelectEmailTemplate.react";
import SelectEmailList from "./SelectEmailList.react";
import ScheduleEmail from "./ScheduleEmail.react";
import CampaignActions from "../../actions/CampaignActions";

class TabsNav extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      selectEmailList: {
        index: 1,
        name: "select email list(s)"
      },
      selectTemplate: {
        index: 2,
        name: "draft email(s)"
      },
      ScheduleEmail: {
        index: 3,
        name: "schedule / send email"
      }
    };
  }

  handleClick(index) {
    this.props.handleClick(index);
  }

  render() {
    let activePointer = "active position";
    let activeTab = "active tabs";
    let emailListIndex = this.state.selectEmailList.index;
    let templateIndex = this.state.selectTemplate.index;
    let scheduleIndex = this.state.ScheduleEmail.index;
    let isEmailList = (this.props.active === emailListIndex);
    let isTemplate = (this.props.active === templateIndex);
    let isSchedule = (this.props.active === scheduleIndex);
    return (
      <div className="tab-container">
        <div className="new-tabs container">
          <div className={isEmailList ? activePointer : "position"}>
            {emailListIndex}
          </div>
          <div className={isEmailList ? activeTab : "tabs"}
            onClick={this.handleClick.bind(this, emailListIndex)}>
            {this.state.selectEmailList.name}
          </div>
          <div className={isTemplate ? activePointer : "position"}>
            {templateIndex}
          </div>
          <div className={isTemplate ? activeTab : "tabs"}
            onClick={this.handleClick.bind(this, templateIndex)}>
            {this.state.selectTemplate.name}
          </div>
          <div className={isSchedule ? activePointer : "position"}>
            {scheduleIndex}
          </div>
          <div className={isSchedule ? activeTab : "tabs"}
            onClick={this.handleClick.bind(this, scheduleIndex)}>
            {this.state.ScheduleEmail.name}
          </div>
        </div>
      </div>
    );
  }
}

class RunCampaign extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 1,
      selectedTemplate: "",
      selectedListIds: {}
    };
  }

  handleClick(index) {
    let ScheduleEmailIndex = 3;
    if (index === ScheduleEmailIndex) {
      CampaignActions.getSelectedEmailList(this.refs.selectEmailList.refs
        .emailListGrid.state.selectedRowIds);
    }
    this.setState({
      activeTab: index
    });
  }

  @autobind
  setTemplateContent() {
    this.setState({
      selectedTemplate: this.refs.SelectEmailTemplate
        .refs.selectPreBuildTemplate.state.activeTemplateContent
    });
  }

  render() {
    return (
      <div>
        <TabsNav handleClick={this.handleClick.bind(this)}
          active={this.state.activeTab} />
        <SelectEmailList ref="selectEmailList" active={this.state.activeTab} />
        <SelectEmailTemplate ref="SelectEmailTemplate"
          setTemplateContent={this.setTemplateContent}
          active={this.state.activeTab} />
        <ScheduleEmail templateContent={this.state.selectedTemplate}
          campaignId={this.props.params.id}
          active={this.state.activeTab}
          selectedTemplate={this.state.selectedTemplate} />
      </div>
    );
  }
}
export default RunCampaign;
