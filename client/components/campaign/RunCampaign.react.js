import React from "react";
import SelectEmailTemplate from "./SelectEmailTemplate.react";
import SelectEmailList from "./SelectEmailList.react";
import ScheduleEmail from "./ScheduleEmail.react";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";

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

  /**
   * render
   * @return {ReactElement} markup
   */
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
            onClick={() => this.handleClick(emailListIndex)}>
            {this.state.selectEmailList.name}
          </div>
          <div className={isTemplate ? activePointer : "position"}>
            {templateIndex}
          </div>
          <div className={isTemplate ? activeTab : "tabs"}
            onClick={() => this.handleClick(templateIndex)}>
            {this.state.selectTemplate.name}
          </div>
          <div className={isSchedule ? activePointer : "position"}>
            {scheduleIndex}
          </div>
          <div className={isSchedule ? activeTab : "tabs"}
            onClick={() => this.handleClick(scheduleIndex)}>
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
      selectedListIds: {},
      isExistId: false
    };
  }

  /**
   * To check campaign id is exists or not
   * add change listener
   */
  componentDidMount() {
    if (this.props.params && this.props.params.id) {
      CampaignActions.isExistCampaign(this.props.params.id);
    }
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  /**
   * remove change listener
   */
  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  handleClick = (index) => {
    let ScheduleEmailIndex = 3;
    if (index === ScheduleEmailIndex) {
      CampaignActions.getSelectedEmailList(this.refs.selectEmailList.refs
        .emailListGrid.state.selectedRowIds);
    }
    this.setState({
      activeTab: index
    });
  }

  setTemplateContent = () => {
    this.setState({
      selectedTemplate: this.refs.SelectEmailTemplate
        .refs.selectPreBuildTemplate.state.activeTemplateContent
    });
  }

  onStoreChange = () => {
    let isExistId = CampaignStore.isExistCampaign();
    this.setState({
      isExistId: isExistId
    });
    displayError(CampaignStore.getError());
  }

  changeSelectedList = (selectedRows) => {
    this.refs
      .selectEmailList.refs
      .emailListGrid.setState({
        selectedRowIds: selectedRows
      });
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    return (
      <div>
       {
         this.state.isExistId
           ?
             <div>
               <TabsNav handleClick={this.handleClick}
                 active={this.state.activeTab} />
               <SelectEmailList ref="selectEmailList" active={this.state.activeTab} />
               <SelectEmailTemplate ref="SelectEmailTemplate"
                 setTemplateContent={this.setTemplateContent}
                 active={this.state.activeTab} />
               <ScheduleEmail campaignId={this.props.params.id}
                 active={this.state.activeTab}
                 changeSelectedList={this.changeSelectedList}
                 selectedTemplate={this.state.selectedTemplate} />
             </div>
            :
              ""
       }
      </div>
    );
  }
}
export default RunCampaign;
