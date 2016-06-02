import React from "react";

class CustomCampaignProgressComponent extends React.Component {
  
  constructor(props) {
    super(props);
  }

  render() {
    let data = this.props.rowData;
    return (
      <div>
        {`${data.campaignProgressDone} out of ${data.campaignProgressTotal}`}
      </div>
    );
  }

}

export default CustomCampaignProgressComponent;
