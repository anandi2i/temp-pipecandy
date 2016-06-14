import React from "react";
import PerformanceCompare from "./performance/PerformanceCompare.react";
import OtherPerformanceStatus from "./performance/OtherPerformanceStatus.react";
import PerformanceReport from "./performance/PerformanceReport.react";
import CampaignReportHead from "./CampaignReportHead.react";

/**
 * Dashboard component to display campaign performance and other status
 */
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {/* Dashboard head */}
        <CampaignReportHead />
        {/* Performance Compared Menu */}
        <PerformanceCompare />
        {/* Performance Chart */}
        <OtherPerformanceStatus />
        {/* Performance Chart */}
        <PerformanceReport />
      </div>
    );
  }
}

export default Dashboard;
