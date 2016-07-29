import React from "react";
import {Link} from "react-router";

class CustomCampaignLinkComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Link to={`/campaign/${this.props.rowData.id}`}>{this.props.rowData.name}</Link>
    );
  }

}

export default CustomCampaignLinkComponent;
