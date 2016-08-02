import React from "react";
import {Link} from "react-router";
import Spinner from "../Spinner.react";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
import CampaignGrid from "../grid/campaign-list/Grid.react";

class CampaignListView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allCampaignLists: [],
      spinning: true
    };
  }

  componentDidMount() {
    CampaignStore.addChangeListener(this.onStoreChange);
    CampaignActions.getAllCampaigns();
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let CampaignLists = CampaignStore.getAllCampaigns();
    this.setState({
      allCampaignLists: CampaignLists,
      spinning: false
    });
    displayError(CampaignStore.getError());
  }

  render() {
    const {spinning, allCampaignLists} = this.state;
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">All Campaigns List</div>
            <div className="sub-head">
              <Link to="/campaign/create">Create Campaign</Link>
            </div>
          </div>
          <div className="spaced"
            style={{display: spinning ? "block" : "none"}}>
            <Spinner />
          </div>
        </div>
        <CampaignGrid results={allCampaignLists} />
      </div>
    );
  }
}

export default CampaignListView;
