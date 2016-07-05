import React from "react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";
/**
 * Display campaign performance component in dashboard
 */
class PerformanceCompare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: [],
    };
  }

  componentDidMount() {
    const {campaignId} = this.props;
    CampaignStore.addPerformanceStoreListener(this.onStoreChange);
    if(!campaignId) {
      CampaignActions.getRecentCampaignMetrics();
    } else{
      CampaignActions.getCurrentCampaignMetrics(campaignId);
    }
  }

  componentWillUnmount() {
    CampaignStore.removePerformanceStoreListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.setState({
      count:CampaignStore.getCampaignMetrics()
    });
  }

  render() {
    const emptyArray = 0;
    const metricData = this.state.count;
    return (
      <div>
      {
        metricData && metricData.length > emptyArray
        ?
        <div className="container">
          <div className="row main-head">Campaign stats</div>
          <div className="row camp-chip-container">
            {
              this.state.count.map((list, key) => {
                return (
                  <div className="col s12 m3 s3" key={key}>
                    <div className="camp-chip">
                      <div className="head">
                        {list.title}
                      </div>
                      <div className="count">
                        <div>{list.percentage}</div>
                        <span>{list.count}</span>
                      </div>
                      {/*
                        TODO This comparison part comes under RUN concepts
                        list.status
                          ? <div className="status">
                              <div className="icon"><i className="mdi mdi-menu-up"></i></div>
                              <div className="count">{list.status}</div>
                            </div>
                          : ""
                      */}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
        : ""
      }
      </div>
    );
  }
}

export default PerformanceCompare;
