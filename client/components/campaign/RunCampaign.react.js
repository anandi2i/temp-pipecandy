import React from "react";
import SelectEmailTemplate from "./SelectEmailTemplate.react";
import SelectEmailList from "./SelectEmailList.react";
import ScheduleEmail from "./ScheduleEmail.react";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
import GridStore from "../../stores/GridStore";

class TabsNav extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      selectEmailList: {
        index: 1,
        name: "Select Email List(s)"
      },
      selectTemplate: {
        index: 2,
        name: "Draft Email(s)"
      },
      ScheduleEmail: {
        index: 3,
        name: "Schedule/Send Email(s)"
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
          <div className={isTemplate ? activePointer : "position"}
            style={{left:"33.2%"}}>
            {templateIndex}
          </div>
          <div className={isTemplate ? activeTab : "tabs"}
            onClick={() => this.handleClick(templateIndex)}>
            {this.state.selectTemplate.name}
          </div>
          <div className={isSchedule ? activePointer : "position"}
            style={{left:"66.5%"}}>
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
      isExistId: false,
      tabs: {
        selectEmailList: 1,
        selectTemplate: 2,
        createCampaign: 3
      }
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
    GridStore.removeSelectedEmailListIds();
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  handleClick = (index) => {
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
    this.refs.selectEmailList.refs.emailListGrid.setState({
      selectedRowIds: selectedRows
    });
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    const {tabs, activeTab} = this.state;
    return (
      <div>
       {
         this.state.isExistId
           ?
             <div>
                <TabsNav handleClick={this.handleClick}
                  active={activeTab} />
                {
                  tabs.selectEmailList === activeTab
                    ? <SelectEmailList ref="selectEmailList"
                        handleClick={this.handleClick}
                        active={activeTab} />
                    : ""
                }
                {
                  tabs.selectTemplate === activeTab
                    ? <SelectEmailTemplate ref="SelectEmailTemplate"
                        setTemplateContent={this.setTemplateContent}
                        handleClick={this.handleClick} />
                    : ""
                }
                {
                  tabs.createCampaign === activeTab
                    ? <ScheduleEmail campaignId={this.props.params.id}
                        changeSelectedList={this.changeSelectedList}
                        selectedTemplate={this.state.selectedTemplate}
                        handleClick={this.handleClick} />
                    : ""
                }
              </div>
            :
              ""
       }
      </div>
    );
  }
}
export default RunCampaign;
