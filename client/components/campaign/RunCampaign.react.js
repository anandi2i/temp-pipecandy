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
    this.state = {
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

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    const {selectEmailList, selectTemplate, ScheduleEmail} = this.state;
    const {active, isParent, handleClick} = this.props;
    const isEmailList = (active === selectEmailList.index) ? "active" : "";
    const isTemplate = (active === selectTemplate.index) ? "active" : "";
    const isSchedule = (active === ScheduleEmail.index) ? "active" : "";
    const isParentCampaign = isParent ? "" : "disabled";
    return (
      <div className="tab-container">
        <div className="new-tabs container">
          <div className={`position ${isEmailList}`}>
            {selectEmailList.index}
          </div>
          <div className={`tabs ${isEmailList}`}
            onClick={() => handleClick(selectEmailList.index)}>
            {selectEmailList.name}
          </div>
          <div className={`position ${isTemplate}`} style={{left:"33.2%"}}>
            {selectTemplate.index}
          </div>
          <div className={`tabs ${isTemplate} ${isParentCampaign}`}
            onClick={() => handleClick(selectTemplate.index)}>
            {selectTemplate.name}
          </div>
          <div className={`position ${isSchedule}`} style={{left:"66.5%"}}>
            {ScheduleEmail.index}
          </div>
          <div className={`tabs ${isSchedule}`}
            onClick={() => handleClick(ScheduleEmail.index)}>
            {ScheduleEmail.name}
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
      subject: "",
      selectedListIds: {},
      isExist: false,
      tabs: {
        selectEmailList: 1,
        selectTemplate: 2,
        createCampaign: 3
      }
    };
  }

  /**
   * Get the campaign detail
   * add change listener
   */
  componentDidMount() {
    if (this.props.params && this.props.params.id) {
      CampaignActions.getCampaign(this.props.params.id);
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

  /**
   * Navigate between tabs
   * Navigation to draft emails is restricted if the campaign is not parent
   * @param {number} index
   */
  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  /**
   * Sets the selected template to the state
   * @param {string} template
   * @param {string} subject
   */
  setTemplate = (template, subject, followups) => {
    this.setState({
      selectedTemplate: template || "",
      subject: subject || "",
      selectedTemplateFollowups: followups || []
    });
  }

  onStoreChange = () => {
    const campaignData = CampaignStore.getCampaignData();
    const state = {
      isParent: campaignData.parentId ? false : true,
      isExist: campaignData.id ? true : false
    };
    if(campaignData.template && campaignData.parentId) {
      state.selectedTemplate = campaignData.template.content || "";
      state.selectedTemplateFollowups = campaignData.followups || [];
      state.subject = campaignData.template.subject || "";
    }
    this.setState(state);
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
    const {tabs, activeTab, isParent, isExist, selectedTemplate, subject,
		selectedTemplateFollowups} = this.state;
    return (
      <div>
       {
         isExist
           ?
             <div>
                <TabsNav handleClick={this.handleClick}
                  active={activeTab} isParent={isParent} />
                {
                  tabs.selectEmailList === activeTab
                    ? <SelectEmailList ref="selectEmailList"
                        handleClick={this.handleClick}
                        active={activeTab} isParent={isParent} />
                    : ""
                }
                {
                  tabs.selectTemplate === activeTab
                    ? <SelectEmailTemplate ref="SelectEmailTemplate"
                        setTemplate={this.setTemplate}
                        handleClick={this.handleClick} />
                    : ""
                }
                {
                  tabs.createCampaign === activeTab
                    ? <ScheduleEmail campaignId={this.props.params.id}
                        changeSelectedList={this.changeSelectedList}
                        selectedTemplate={selectedTemplate}
                        selectedTemplateFollowups={selectedTemplateFollowups}
                        subject={subject} isParent={isParent}
                        setTemplate={this.setTemplate}
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
