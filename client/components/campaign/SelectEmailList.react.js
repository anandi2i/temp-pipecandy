import React from "react";
// import {Link} from "react-router";
// import autobind from "autobind-decorator";
// import CampaignActions from "../../actions/CampaignActions";
// import CampaignStore from "../../stores/CampaignStore";

class SelectEmailList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 1
    };
  }

  render() {
    return (
      <div className="container" style={{display: this.props.active === this.state.index ? "block" : "none"}}>
        <h4> Select Email List </h4>
      </div>
    );
  }
}

export default SelectEmailList;
