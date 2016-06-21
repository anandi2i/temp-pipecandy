import React from "react";
import Griddle from "griddle-react";
import CustomPagerComponent from "../CustomGridPagination.react";
import CustomPreviewComponent from "./CustomPreviewComponent.react";
import CustomCampaignLinkComponent from "./CustomCampaignLinkComponent.react";
import CustomCampaignRunComponent from "./CustomCampaignRunComponent.react";
import CustomCampaignProgressComponent from
  "./CustomCampaignProgressComponent.react";

let columnMeta = [{
    "columnName": "id",
    "order": 1,
    "locked": true,
    "visible": true,
    "sortable": false,
    "displayName": " ",
    "cssClassName": "preview",
    "customComponent": CustomPreviewComponent
  }, {
    "columnName": "name",
    "order": 2,
    "locked": true,
    "visible": true,
    "displayName": "Campaign Name",
    "cssClassName" : "campaign-name",
    "customComponent": CustomCampaignLinkComponent
  }, {
    "columnName": "listSentTo",
    "order": 3,
    "locked": true,
    "visible": true,
    "displayName": "List Sent To",
    "sortable": false,
    "cssClassName" : ""
  }, {
    "columnName": "campaignStatus",
    "order": 4,
    "locked": true,
    "visible": true,
    "displayName": "Status",
    "cssClassName" : ""
  }, {
    "columnName": "campaignReplies",
    "order": 5,
    "locked": true,
    "visible": true,
    "displayName": "Replies",
    "cssClassName": "replies",
    "sortable": false
  }, {
    "columnName": "campaignProgress",
    "order": 6,
    "locked": true,
    "visible": true,
    "displayName": "Progress",
    "sortable": false,
    "cssClassName" : ""
  }, {
    "columnName": "campaignAction",
    "order": 7,
    "locked": true,
    "visible": true,
    "displayName": "Actions",
    "sortable": false,
    "cssClassName" : "",
    "customComponent": CustomCampaignProgressComponent
  }, {
    "columnName": "campaignRun",
    "order": 8,
    "locked": true,
    "visible": true,
    "displayName": " ",
    "sortable": false,
    "cssClassName": "campaign-run-btn",
    "customComponent": CustomCampaignRunComponent
  }];

class CampaignGrid extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="row" id="campaign_list">
        <div className="container">
          <Griddle
            results={this.props.results}
            tableClassName="responsive-table"
            useGriddleStyles={false}
            columnMetadata={columnMeta}
            columns={["id", "name", "listSentTo",
              "campaignStatus", "campaignReplies",
              "campaignProgress", "campaignAction",
              "campaignRun"]}
            metadataColumns={[]}
            showPager={true}
            resultsPerPage="7"
            useCustomPagerComponent={true}
            customPagerComponent={CustomPagerComponent}
            showFilter={true}
            filterPlaceholderText="SEARCH CAMPAIGNS"
            sortDefaultComponent={
              <span className="mdi mdi-arrow-up"></span>
            }
            sortAscendingComponent={
              <span className="mdi mdi-arrow-up active"></span>
            }
            sortDescendingComponent={
              <span className="mdi mdi-arrow-down active"></span>
            } />
        </div>
      </div>
    );
  }

}

CampaignGrid.defaultProps = {
  results: []
};

export default CampaignGrid;
