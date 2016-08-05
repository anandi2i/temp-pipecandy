import React from "react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignReportStore from "../../../stores/CampaignReportStore";

/**
 * The class LinksClicked describes the recently clicked links, number of clicks
 *   of the links and click rates on the dashboard
 */
class LinksClicked extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      emailLinkClicks: []
    };
  }

  componentDidMount() {
    CampaignActions.getEmailLinkClicks(this.props.campaignId);
    CampaignReportStore.addReportViewChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignReportStore.removeReportViewChangeListener(this.onStoreChange);
  }

  /**
   * Update the email links for the campaign
   */
  onStoreChange = () => {
    this.setState({
      emailLinkClicks: CampaignReportStore.getEmailLinkClicks()
    });
  }

  /**
   * render
   * @return {ReactElement} The element contatins links clicked,
   * number of click and click rate
   */
  render() {
    const {emailLinkClicks} = this.state;
    const linksDetails = emailLinkClicks.map((link, key) => {
      return (
        <div className="row" key={key}>
          <div className="col s6 m8 links-clicked-data">
            <a target="_blank" href={link.link}>{link.link}</a>
          </div>
          <div className="col m2 s3">{link.clickCount}</div>
          <div className="col m2 s3 percentage">{link.clickRate}</div>
        </div>
      );
    });
    return (
      <div className="container links-clicked-container"
        style={{display: emailLinkClicks.length? "block": "none"}}>
        <div className="row main-head">
          Links Clicked
        </div>
        <div className="links-clicked row">
          <div className="col s6 m8 links-clicked-header">Link</div>
          <div className="col s3 m2 links-clicked-header">Number of Clicks</div>
          <div className="col s3 m2 links-clicked-header">Click Rate</div>
        </div>
        {linksDetails}
      </div>
    );
  }
}

export default LinksClicked;
