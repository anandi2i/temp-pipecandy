import React from "react";
import {Link} from "react-router";

/**
 * Campaign report CampaignInfoMsg
 */
class CampaignInfoMsg extends React.Component {
  render() {
    const message = this.props.message;
    return (
      <div className="empty-campaign">
        <img src="/images/meditation.png" />
        <div className="quotes">
          "The more you know, the less you need"
        </div>
        <div>- Yvon Chouinard</div>
        <div className="content">
          <span style={{display: message === "noReport" ? "block": "none"}}>
            This campaign has nothing much to report yet.
            <Link to={"/campaign"}> Go home! </Link>
          </span>
          <span style={{display: message === "noCampaigns" ? "block": "none"}}>
            There are no campaigns yet.
            <Link to={"/campaign/create"}> Want to create one? </Link>
          </span>
        </div>
      </div>
    );
  }
}
export default CampaignInfoMsg;
