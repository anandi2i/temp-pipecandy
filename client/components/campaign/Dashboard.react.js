import React from "react";
import PerformanceCompare from "./performance/PerformanceCompare.react";
import OtherPerformanceStatus from "./performance/OtherPerformanceStatus.react";
import PerformanceReport from "./performance/PerformanceReport.react";
import LinksClicked from "./performance/LinksClicked.react";
import CampaignInfoMsg from "./performance/CampaignInfoMsg.react";
import CampaignReportHead from "./CampaignReportHead.react";
import CampaignActions from "../../actions/CampaignActions";
import CampaignReportStore from "../../stores/CampaignReportStore";

/**
 * Dashboard component to display campaign performance and other status
 */
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRecentCampaign: false
    };
  }

  componentDidMount() {
    CampaignReportStore.addReportViewChangeListener(this.onStoreChange);
    CampaignActions.getIsExistingCampaign(false);
  }

  componentWillUnmount() {
    CampaignReportStore.removeReportViewChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.setState({
      isRecentCampaign: CampaignReportStore.getIsExistCampaign()
    });
  }

  render() {
    return (
      <div>
        {this.state.isRecentCampaign
          ? <div>
              {/* Dashboard head */}
              <CampaignReportHead />
              {/* Performance Compared Menu */}
              <PerformanceCompare />
              {/* Performance Chart */}
              <OtherPerformanceStatus />
              {/* Performance Chart */}
              <PerformanceReport />
              {/* Links Clicked */}
              <LinksClicked />
            </div>
          : <CampaignInfoMsg displayPage="dashboard" />
        }
      </div>
    );
  }
}

export default Dashboard;
