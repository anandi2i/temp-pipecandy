import React from "react";
import {Link} from "react-router";

class CustomCampaignRunComponent extends React.Component {
  
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Link className="btn" to={`/campaign/${this.props.rowData.id}/run`}>New Run</Link>
    );
  }

}

export default CustomCampaignRunComponent;
