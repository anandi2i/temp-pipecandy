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
      isSpinner: true,
      isCampaign: false
    };
  }

  componentDidMount() {
    CampaignReportStore.addReportViewChangeListener(this.onStoreChange);
    CampaignActions.getIsExistingCampaign(this.props.params.id);
  }

  componentWillUnmount() {
    CampaignReportStore.removeReportViewChangeListener(this.onStoreChange);
    CampaignReportStore.removeIsExistCampaign();
  }

  onStoreChange = () => {
    this.setState({
      isCampaign: CampaignReportStore.getIsExistCampaign(),
      isSpinner: false
    });
  }

  render() {
    const campaignId = this.props.params.id;
    const {isCampaign, isSpinner} = this.state;
    return (
      <div>
        <div className="container" style={{display: isSpinner? "block" : "none"}}>
          <div className="spinner-container">
            <Spinner />
          </div>
        </div>
        {
          isCampaign && !isSpinner
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
                  <LinksClicked campaignId={campaignId}/>
                </div>
              </div>
            : <CampaignInfoMsg displayPage="dashboard" />
        }
        <CampaignFooter campaignId={campaignId} activePage={"report"}/>
      </div>
    );
  }
}

export default ViewCampaign;
