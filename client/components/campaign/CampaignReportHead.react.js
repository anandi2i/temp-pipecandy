import React from "react";
import {Link} from "react-router";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
import _ from "underscore";
/**
 * Header part for Dashboard and Campaign report
 */
class CampaignReportHead extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      campaignDetails: {}
    };
  }

  componentDidMount() {
    const campaignId = this.props.campaignId || this.props.recentCampaignId;
    CampaignStore.addReportStoreListener(this.onStoreChange);
    if(!campaignId) {
      CampaignActions.getRecentCampaignDetails();
    } else{
      CampaignActions.getCurrentCampaignDetails(campaignId);
    }
  }

  componentWillUnmount() {
    CampaignStore.removeReportStoreListener(this.onStoreChange);
  }

  onStoreChange = () => {
    const campaignDetails = CampaignStore.getCampaignDetails();
    if(!_.isEmpty(campaignDetails)){
      this.setState({
        campaignDetails: campaignDetails
      });
    }
  }

  render() {
    const campaignId = this.props.campaignId || this.props.recentCampaignId;
    const campaignDetails = this.state.campaignDetails;
    return (
      <div className="container">
        {
          !_.isEmpty(campaignDetails)
            ?
            <div className="row sub-nav dashboard-head">
              <div className="head">{campaignDetails.campaignName}</div>
              <div className="head campaign-detail-section">
                <ul className="separator">
                  <li> Sent to {campaignDetails.listCount} lists
                    <i className="mdi mdi-record"></i>
                    {campaignDetails.recepientCount} recipients
                    {
                      !this.props.campaignId
                      ?
                      <i className="mdi mdi-record"></i>
                      : ""
                    }                    
                  </li>
                  <li>
                    {
                      !this.props.campaignId
                      ?
                      <Link to={`/campaign/${campaignId}`} >View Details Report</Link>
                      : ""
                    }
                </li>
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
            : ""
        }
      </div>
    );
  }
}
export default CampaignReportHead;
