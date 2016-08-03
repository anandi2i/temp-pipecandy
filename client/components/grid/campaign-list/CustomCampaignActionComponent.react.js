import React from "react";
import {Link} from "react-router";
import CampaignActions from "../../../actions/CampaignActions";

class CustomCampaignActionComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  /**
   * Call action to pause the campaign
   * @param  {number} campaignId
   */
  pauseCampaign(campaignId) {
    CampaignActions.pauseCampaign(campaignId);
  }

  /**
   * Call action to resume the campaign
   * @param  {number} campaignId
   */
  resumeCampaign(campaignId) {
    CampaignActions.resumeCampaign(campaignId);
  }

  render() {
    const status = this.props.data;
    const campaignId = this.props.rowData.id;
    return (
      <div className="campaign-action">
        {(() => {
          if(status === "In Draft") {
            return (
              <Link to={`/campaign/${campaignId}/run`}>
                Run
              </Link>
            );
          } else if(status === "Scheduled") {
            return (
              <a onClick={() => this.pauseCampaign(campaignId)}> Pause </a>
            );
          } else if(status === "Paused") {
            return (
              <a onClick={() => this.resumeCampaign(campaignId)}> Resume </a>
            );
          } else if(status === "Sent") {
            return (
              <Link to={`/campaign/${campaignId}`}>
                View Report
              </Link>
            );
          }
        })()}
      </div>
    );
  }

}

export default CustomCampaignActionComponent;
