import React from "react";
import {Link} from "react-router";
import _ from "underscore";
import moment from "moment";
import UserStore from "../stores/UserStore";
import CampaignActions from "../actions/CampaignActions";
import CampaignReportStore from "../stores/CampaignReportStore";
import CampaignStore from "../stores/CampaignStore";

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      userName: UserStore.getUser(),
      campaignDetails: {},
      campaignMetrics: {}
    };
  }

  componentDidMount() {
    CampaignActions.hasRecentCampaign();
    UserStore.addChangeListener(this.onStoreChange);
    CampaignReportStore.addReportViewChangeListener(this.CampaignIdChange);
    CampaignStore.addReportStoreListener(this.recentStatsChange);
    CampaignStore.addPerformanceStoreListener(this.campaignMetricsChange);
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this.onStoreChange);
    CampaignReportStore.removeReportViewChangeListener(this.CampaignIdChange);
    CampaignReportStore.resetRecentCampaignId();
    CampaignStore.removeReportStoreListener(this.recentStatsChange);
    CampaignStore.removePerformanceStoreListener(this.campaignMetricsChange);
  }

  onStoreChange = () => {
    this.setState({
      userName: UserStore.getUser()
    });
  }

  /**
   * Get the recent campaign id
   * Call action to get Campaign details
   * Call actio to get campaign metrics
   */
  CampaignIdChange = () => {
    const recentCampaignId = CampaignReportStore.recentCampaignId();
    if(recentCampaignId) {
      CampaignActions.getCurrentCampaignDetails(recentCampaignId);
      CampaignActions.getCurrentCampaignMetrics(recentCampaignId);
    }
  }

  /**
   * On campaign details change update the state
   */
  recentStatsChange = () => {
    const campaignDetails = CampaignStore.getCampaignDetails();
    this.setState({
      campaignDetails: campaignDetails
    });
  }

  /**
   * On campaign metrics change update the state
   */
  campaignMetricsChange = () => {
    const metricsArray = CampaignStore.getCampaignMetrics();
    //http://stackoverflow.com/questions/10416424/underscore-js-create-a-map-out-of-list-of-objects-using-a-key-found-in-the-obje
    const campaignMetricsObj = _.object(_.map(
      metricsArray, campaign => [campaign.title.replace(/ /g, ""), campaign]
    ));
    this.setState({
      campaignMetrics: campaignMetricsObj
    });
  }

  /**
   * Render HTML element
   */
  render() {
    const {campaignDetails, campaignMetrics} = this.state;
    const executedAt =
      moment(campaignDetails.executedAt).format("DD MMM YYYY h:mm A");
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              Hi&nbsp;
              {
                this.state.userName
                  ? this.state.userName.firstName
                  : "There"
              }!
              What do you want to do today?
            </div>
            <div className="row tab-hd-btn">
              <div className="col s12 m12 l6 right-align m-t-47">
                <Link className="btn lg-btn-dflt red" to="/campaign/create">
                  Create a Campaign
                </Link>
              </div>
              <div className="col s12 m12 l6 left-align m-t-47">
                <Link className="btn lg-btn-dflt blue" to="/dashboard">
                  Go to your Dashboard
                </Link>
              </div>
            </div>
          </div>
          {
            !_.isEmpty(campaignDetails && campaignMetrics) ?
              <div className="campaign-status-cont">
                <div className="gray-head"> Recent campaign stats </div>
                <div className="campaign-status">
                  <ul>
                    <li className="blue-head">
                      <Link to={`/campaign/${campaignDetails.campaignId}`}>
                        {campaignDetails.campaignName}
                      </Link>
                    </li>
                    <li className="blue-txt">
                      <i className="separator">&nbsp;</i>
                      {campaignDetails.recepientCount} recipients
                    </li>
                    <li className="blue-txt">
                      <i className="separator">&nbsp;</i>
                      {executedAt}
                    </li>
                  </ul>
                  <div className="campaign-status-info center row">
                    <div className="col s6 m4 l2">
                      <div className="info">Opened</div>
                      <div className="status">
                        {campaignMetrics.opened.percentage}
                      </div>
                    </div>
                    <div className="col s6 m4 l2">
                      <div className="info">responded</div>
                      <div className="status">
                        {campaignMetrics.actionableresponses.percentage}
                      </div>
                    </div>
                    <div className="col s6 m4 l2">
                      <div className="info">Clicked</div>
                      <div className="status">
                        {campaignMetrics.clicked.percentage}
                      </div>
                    </div>
                    <div className="col s6 m4 l2">
                      <div className="info">Bounced</div>
                      <div className="status">
                        {campaignMetrics.bounced.percentage}
                      </div>
                    </div>
                    <div className="col s6 m4 l2">
                      <div className="info">Unsubscribed</div>
                      <div className="status">
                        {campaignMetrics.unsubscribed.percentage}
                      </div>
                    </div>
                    <div className="col s6 m4 l2">
                      <div className="info">Spam</div>
                      <div className="status">
                        {campaignMetrics.spam.percentage}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            : null
          }
        </div>
      </div>
    );
  }
}

export default Home;
