import React from "react";
import PerformanceCompare from "../performance/PerformanceCompare.react";
import OtherPerformanceStatus from
  "../performance/OtherPerformanceStatus.react";
import PerformanceReport from "../performance/PerformanceReport.react";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignReportStore from "../../../stores/CampaignReportStore";

/**
 * Display selected campaign component to display campaign performance
 * and other status
 */
class ViewCampaign extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExistCampaign: false
    };
  }

  componentDidMount() {
    CampaignReportStore.addReportViewChangeListener(this.onStoreChange);
    CampaignActions.getIsExistingCampaign(this.props.params.id);
  }

  componentWillUnmount() {
    CampaignReportStore.removeReportViewChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.setState({
      isExistCampaign: CampaignReportStore.getIsExistCampaign()
    });
  }

  render() {
    const campaignId = this.props.params.id;
    return (
      <div>
        {this.state.isExistCampaign
          ? <div>
              <div className="m-b-120">
                {/* Dashboard head */}
                <CampaignReportHead campaignId={campaignId}/>
                {/* Performance Compared Menu */}
                <PerformanceCompare campaignId={campaignId}/>
                {/* Performance Chart */}
                <OtherPerformanceStatus campaignId={campaignId}/>
                {/* Performance Chart */}
                <PerformanceReport campaignId={campaignId}/>
              </div>
              <CampaignFooter campaignId={campaignId} activePage={"report"}/>
            </div>
          : ""
        }
      </div>
    );
  }
}

export default ViewCampaign;
