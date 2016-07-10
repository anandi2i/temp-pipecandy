import React from "react";
import {Link} from "react-router";

/**
 * Campaign report footer
 */
class CampaignFooter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: this.props.activePage,
      campaignId: this.props.campaignId
    };
  }

  render() {
    const active = this.state.activeTab;
    const id = this.state.campaignId;
    return (
      <div className="footer">
        <div className="container footer-tabs">
          <Link to={`/campaign/${id}`} className={active === "report" ? "active" : ""}>Report</Link>
          <Link to={`/campaign/${id}/inbox`} className={active === "inbox" ? "active" : ""}>Inbox</Link>
          <Link to={`/campaign/${id}/scheduled`} className={active === "scheduled" ? "active" : ""}>Scheduled</Link>
        </div>
      </div>
    );
  }
}
export default CampaignFooter;
