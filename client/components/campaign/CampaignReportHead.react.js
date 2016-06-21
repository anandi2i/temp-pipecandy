import React from "react";
import {Link} from "react-router";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
/**
 * Header part for Dashboard and Campaign report
 */
class CampaignReportHead extends React.Component {
  constructor(props) {
    super(props);
    // TODO remove static data
    this.state = {
      campaignDetails: {}
    };
  }

  componentDidMount() {
    const {campaignId} = this.props;
    CampaignStore.addChangeListener(this.onStoreChange);
    if(!campaignId) {
      CampaignActions.getRecentCampaignDetails();
    } else{
      CampaignActions.getCurrentCampaignDetails(campaignId);
    }
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
      this.setState({
        campaignDetails:CampaignStore.getCampaignDetails(),
        campaignDate : CampaignStore.getCampaignDetails().executedAt
      });
  }

  render() {
    const campaignId = this.props.campaignId;
    const campaignDetails = this.state.campaignDetails;
    return (
      <div className="container">
        <div className="row sub-nav dashboard-head">
          <div className="head">{campaignDetails.campaignName}</div>
          <div className="head campaignDetailSection">
            <ul className="separator">
              <li> Sent to {campaignDetails.listCount} lists
                <i className="mdi mdi-record"></i>
                {campaignDetails.recepientCount} recipients
                <i className="mdi mdi-record"></i>
              </li>
              <li><a>View Details Report</a></li>
            </ul>
          </div>
          {
            campaignId
            ?
            <div className="sub-head">
              <Link to="/campaign">Previous Campaign Reports</Link>
            </div>
            : ""
          }
        </div>
      </div>
    );
  }
}
export default CampaignReportHead;
