import React from "react";
import PerformanceCompare from "./performance/PerformanceCompare.react";
import OtherPerformanceStatus from "./performance/OtherPerformanceStatus.react";
import PerformanceReport from "./performance/PerformanceReport.react";
import LinksClicked from "./performance/LinksClicked.react";
import CampaignInfoMsg from "./performance/CampaignInfoMsg.react";
import CampaignReportHead from "./CampaignReportHead.react";
import CampaignActions from "../../actions/CampaignActions";
import CampaignReportStore from "../../stores/CampaignReportStore";
import Spinner from "../Spinner.react";

/**
 * Dashboard component to display campaign performance and other status
 */
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSpinner: true,
      recentCampaignId: null
    };
  }

  componentDidMount() {
    CampaignReportStore.addReportViewChangeListener(this.onStoreChange);
    CampaignActions.hasRecentCampaign();
  }

  componentWillUnmount() {
    CampaignReportStore.removeReportViewChangeListener(this.onStoreChange);
    CampaignReportStore.resetRecentCampaignId();
  }

  onStoreChange = () => {
    this.setState({
      isSpinner: false,
      recentCampaignId: CampaignReportStore.recentCampaignId()
    });
  }

  render() {
    const {isSpinner, recentCampaignId} = this.state;
    return (
      <div>
        <div className="container" style={{display: isSpinner? "block" : "none"}}>
          <div className="spinner-container">
            <Spinner />
          </div>
        </div>
        {
          recentCampaignId && !isSpinner
            ?
              <div>
                {/* Dashboard head */}
                <CampaignReportHead recentCampaignId={recentCampaignId}/>
                {/* Performance Compared Menu */}
                <PerformanceCompare campaignId={recentCampaignId}/>
                {/* Performance Chart */}
                <OtherPerformanceStatus campaignId={recentCampaignId}/>
                {/* Performance Chart */}
                <PerformanceReport campaignId={recentCampaignId}/>
                {/* Links Clicked */}
                <LinksClicked campaignId={recentCampaignId}/>
              </div>
            :
              <CampaignInfoMsg displayPage="dashboard" />
        }
      </div>
    );
  }
}

export default Dashboard;
