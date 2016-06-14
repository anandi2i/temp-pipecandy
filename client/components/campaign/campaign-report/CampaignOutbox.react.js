import React from "react";
import PerformanceCompare from "../performance/PerformanceCompare.react";
import PerformanceStatus from "../performance/OtherPerformanceStatus.react";
import PerformanceReport from "../performance/PerformanceReport.react";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";

/**
 * Display selected campaign outbox report
 */
class CampaignOutbox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div>
          <div className="m-b-120">
            {/* Dashboard head */}
            <CampaignReportHead />
            {/* Performance Compared Menu */}
            <PerformanceCompare />
            {/* Performance Chart */}
            <PerformanceStatus />
            {/* Performance Chart */}
            <PerformanceReport />
          </div>
          <CampaignFooter campaignId={this.props.params.id} activePage={"outbox"}/>
      </div>
    );
  }
}

export default CampaignOutbox;
