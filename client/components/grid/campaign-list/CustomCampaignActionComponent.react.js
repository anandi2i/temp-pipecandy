import React from "react";
import {Link} from "react-router";

class CustomCampaignActionComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const status = this.props.data;
    return (
      <div className="campaign-action">
        {(() => {
          if(status === "In Draft") {
            return (
              <Link to={`/campaign/${this.props.rowData.id}/run`}>
                Run
              </Link>
            );
          } else if(status === "Scheduled") {
            return <a>Pause</a>;
          } else if(status === "Paused") {
            return <a>Resume</a>;
          } else if(status === "Sent") {
            return (
              <Link to={`/campaign/${this.props.rowData.id}`}>
                View Report
              </Link>
            );
          }
        })()}
      </div>
    );
  }

}

export default CustomCampaignActionComponent;
