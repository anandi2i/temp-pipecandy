import React from "react";
import PerformanceCompare from "../performance/PerformanceCompare.react";
import PerformanceStatus from "../performance/OtherPerformanceStatus.react";
import PerformanceReport from "../performance/PerformanceReport.react";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";

/**
 * Display selected campaign component to display campaign performance
 * and other status
 */
class ViewCampaign extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const campaignId = this.props.params.id;
    return (
        <div>
          <div className="m-b-120">
            {/* Dashboard head */}
            <CampaignReportHead campaignId={campaignId}/>
            {/* Performance Compared Menu */}
            <PerformanceCompare campaignId={campaignId}/>
            {/* Performance Chart */}
            <PerformanceStatus />
            {/* Performance Chart */}
            <PerformanceReport />
          </div>
          <CampaignFooter campaignId={campaignId} activePage={"report"}/>
      </div>
    );
  }
}

export default ViewCampaign;
