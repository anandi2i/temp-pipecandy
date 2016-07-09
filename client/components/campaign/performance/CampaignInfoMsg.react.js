import React from "react";
import {Link} from "react-router";

/**
 * Campaign report CampaignInfoMsg
 */
class CampaignInfoMsg extends React.Component {
  render() {
    const displayPage = this.props.displayPage;
    return (
      <div className="empty-campaign">
        <img src="/images/meditation.png" />
        <div className="quotes">
          "The more you know, the less you need"
        </div>
        <div>- Yvon Chouinard</div>
        <div className="content">
          {displayPage === "report"
            ?
              <span>Your campaigns are scheduled. Let's wait till the action begins!</span>
            :
              <span>There are no campaigns yet.<Link to={`/campaign/create`}> Want to create one?</Link></span>
          }
        </div>
      </div>
    );
  }
}
export default CampaignInfoMsg;
