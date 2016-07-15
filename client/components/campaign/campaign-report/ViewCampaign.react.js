import React from "react";
import PerformanceCompare from "../performance/PerformanceCompare.react";
import OtherPerformanceStatus from
  "../performance/OtherPerformanceStatus.react";
import PerformanceReport from "../performance/PerformanceReport.react";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import CampaignInfoMsg from "../performance/CampaignInfoMsg.react";
import LinksClicked from "../performance/LinksClicked.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignReportStore from "../../../stores/CampaignReportStore";
import Spinner from "../../Spinner.react";

/**
 * Display selected campaign component to display campaign performance
 * and other status
 */
class ViewCampaign extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExistCampaign: ""
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
    const isExistCampaign = this.state.isExistCampaign;
    return (
      <div>
        <div className="container"
          style={{display: isExistCampaign ? "none" : "block"}} >
          <div className="spinner-container">
            <Spinner />
          </div>
        </div>
        {isExistCampaign === "displayReport"
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
                {/* Links Clicked */}
                <LinksClicked />
              </div>
              <CampaignFooter campaignId={campaignId} activePage={"report"}/>
            </div>
          : ""
        }
        {isExistCampaign === "displayMessage"
          ? <CampaignInfoMsg displayPage="dashboard" />
          : ""
        }
      </div>
    );
  }
}

export default ViewCampaign;
