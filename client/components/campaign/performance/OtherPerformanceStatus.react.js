import React from "react";
import TagNameMenu from "../../TagNameMenu.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignReportStore from "../../../stores/CampaignReportStore";

/**
 * Other Performance status dashboard component
 */
class OtherPerformanceStatus extends React.Component {
  constructor(props) {
    super(props);
    /**
     * TODO remove static data
     * Add new menu
     *  {
          name: "Last Month",
          class: "menu"
        },
        {
          name: "Last 3 Month",
          class: "menu hide-on-700" // This tab will hide below 700px
        },
        tabs: ["new index"],
     * @type {Object}
     *
     */
    this.state = {
      count :[],
      tab: [
        {
          name: "Show status for",
          class: "menu"
        },
        {
          name: "Last 1 Month",
          class: "menu"
        }
      ],
      activeTab: "1",
      tabs: ["1"],
      otherStatsMetrics: []
    };
  }


  componentDidMount() {
    CampaignReportStore.addOtherStatsChangeListener(this.onStoreChange);
    CampaignActions.getCampaignReport(this.props.campaignId);
  }

  componentWillUnmount() {
    CampaignReportStore.removeOtherStatsChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let otherStatsMetrics = CampaignReportStore.getOtherStatsMetrics();
    this.setState({
      otherStatsMetrics: [{
        "title": "emails sent",
        "percentage": otherStatsMetrics.sentEmails,
        "class": ""
      },
      {
        "title": "emails delivered",
        "percentage": otherStatsMetrics.deliveredEmails,
        "class": ""
      },
      {
        "title": "responses",
        "percentage": otherStatsMetrics.responses,
        "class": ""
      },
      {
        "title": "followups done",
        "percentage": otherStatsMetrics.followUpsSent,
        "class": ""
      }]
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
    const campaignMetrics = this.state.count;
    return (
      <div className="container">
        {
          campaignMetrics
          ?
          <div>
          <div className="row main-head">
            Other stats
          </div>
          <div className="row tag-name-menu">
            <TagNameMenu handleClick={this.handleClick}
              active={activeTab}
              tab={tab} />
          </div>
          <div className="row camp-chip-container" style={{display: activeTab === tabs[0] ? "block" : "none"}}>
            {
              this.state.otherStatsMetrics.map((list, key) => {
                return (
                  <div className="col s12 m3 s3" key={key}>
                    <div className="other-status">
                      <div className="container">
                        <div className="head">
                          {list.title}
                        </div>
                        <div className="value">
                          <div className={list.class}>{list.percentage}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
          {/* New Tab Content
            <div className="row camp-chip-container" style={{display: activeTab === tabs[1] ? "block" : "none"}}>
              <h2>Sample Content Tab2</h2>
            </div>
          */}
          </div>
          : ""
        }
      </div>
    );
  }
}

export default OtherPerformanceStatus;
