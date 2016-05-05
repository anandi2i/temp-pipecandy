import React from "react";
import {Link} from "react-router";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";

function getAllCampaigns() {
  CampaignActions.getAllCampaigns();
}

class CampaignListView extends React.Component {
  constructor(props) {
    super(props);
    getAllCampaigns();
    this.state={
      allCampaignLists: [],
    };
  }

  componentDidMount() {
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let CampaignLists = CampaignStore.getAllCampaigns();
    this.setState({
      allCampaignLists: CampaignLists
    });
    displayError(CampaignStore.getError());
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">All Campaigns List</div>
            <div className="sub-head">
              <Link to="/campaign/create">Create Campaign</Link>
            </div>
          </div>
          <table className="striped">
            <thead>
              <tr>
                <th data-field="id">Campaign Id</th>
                <th data-field="name">Name</th>
                <th data-field="edit">Edit</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.allCampaignLists.map(
                  $.proxy(function (campaign, key) {
                  return (
                    <tr key={key}>
                      <td>{campaign.id}</td>
                      <td>{campaign.name}</td>
                      <td><Link to={`/campaign/${campaign.id}`}>view</Link></td>
                    </tr>
                  );
                }), this)
              }
          </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default CampaignListView;
