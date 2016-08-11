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
      metricData: [],
    };
  }

  componentDidMount() {
    const {campaignId} = this.props;
    CampaignStore.addPerformanceStoreListener(this.onStoreChange);
    CampaignActions.getCurrentCampaignMetrics(campaignId);
  }

  componentWillUnmount() {
    CampaignStore.removePerformanceStoreListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.setState({
      metricData: CampaignStore.getCampaignMetrics()
    });
  }

  render() {
    const {metricData} = this.state;
    return (
      <div>
        <div className="container"
          style={{display: metricData.length ? "block" : "none"}}>
          <div className="row main-head">Key stats</div>
          <div className="row camp-chip-container">
            {
              metricData.map((list, key) => {
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
      </div>
    );
  }
}

export default PerformanceCompare;
