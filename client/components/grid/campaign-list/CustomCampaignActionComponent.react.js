import React from "react";
import ReactDOM from "react-dom";
import {Link} from "react-router";
import CampaignActions from "../../../actions/CampaignActions";

class CustomCampaignActionComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  /**
   * Initialize the dropdown button
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    enabledropDownBtn(this.el.find(".dropdown-button"));
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

  /**
   * Call action to create new run
   * @param  {number} campaignId
   */
  newRun(campaignId) {
    CampaignActions.createNewRun(campaignId);
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
          } else if(status === "Scheduled" || status === "In Progress"
              || status === "Resumed") {
            return (
              <a onClick={() => this.pauseCampaign(campaignId)}> Pause </a>
            );
          } else if(status === "Paused") {
            return (
              <a onClick={() => this.resumeCampaign(campaignId)}> Resume </a>
            );
          } else if(status === "Sent") {
            return (
              <div>
                <a className="btn btn-dflt blue sm-icon-btn dropdown-button" data-activates={`campaignOption${campaignId}`}>
                  options
                </a>
                <ul id={`campaignOption${campaignId}`} className="dropdown-content">
                  <li>
                    <Link to={`/campaign/${campaignId}`}> View Report </Link>
                  </li>
                  <li>
                    <Link onClick={() => this.newRun(campaignId)} to="/campaign">
                      New Run
                    </Link>
                  </li>
                </ul>
              </div>


            );
          }
        })()}
      </div>
    );
  }

}

export default CustomCampaignActionComponent;
