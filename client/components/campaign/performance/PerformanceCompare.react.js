import React from "react";
import TagNameMenu from "../../TagNameMenu.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";
/**
 * Display campaign performance component in dashboard
 */
class PerformanceCompare extends React.Component {
  constructor(props) {
    super(props);
    // TODO remove static data
    this.state = {
      count: [],
      tab: [
        {
          name: "Performance compared with",
          class: "menu"
        },
        {
          name: "Previous run",
          class: "menu"
        },
        {
          name: "Industry average",
          class: "menu"
        }
      ],
      tabs: ["1", "2"],
      activeTab: "1"
    };
  }

  componentDidMount() {
    const {campaignId} = this.props;;
    CampaignStore.addChangeListener(this.onStoreChange);
    if(!campaignId) {
      CampaignActions.getRecentCampaignMetrics();
    } else{
      CampaignActions.getCurrentCampaignMetrics(campaignId);
    }
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
      this.setState({
        count:CampaignStore.getCampaignMetrics()
      });
  }
  /**
   * handle tab navigations
   * @param {string} index active-tab
   */
  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  render() {
    const activeTab = this.state.activeTab;
    const tab = this.state.tab;
    const tabs = this.state.tabs;
    return (
      <div className="container">
        {/* Top tag Menu */}
        <div className="row tag-name-menu">
          <TagNameMenu handleClick={this.handleClick}
            active={activeTab}
            tab={tab} />
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[0] ? "block" : "none"}}>
          {
            this.state.count.map((list, key) => {
              return (
                <div className="col s12 m3 s3" key={key}>
                  <div className="camp-chip">
                    <div className="head">
                      {list.title}
                    </div>
                    <div className="count">
                      <div>{list.percentage}</div>
                      <span>{list.count}</span>
                    </div>
                    {
                      list.status
                        ? <div className="status">
                            <div className="icon"><i className="mdi mdi-menu-up"></i></div>
                            <div className="count">{list.status}</div>
                          </div>
                        : ""
                    }
                  </div>
                </div>
              );
            })
          }
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[1] ? "block" : "none"}}>
          {/* TODO Add UI */}
          <h2>Sample Content Tab2</h2>
        </div>
      </div>
    );
  }
}

export default PerformanceCompare;
