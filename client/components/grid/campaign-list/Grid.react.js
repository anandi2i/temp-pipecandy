import React from "react";
import _ from "underscore";
import Griddle from "griddle-react";
import CustomPagerComponent from "../CustomGridPagination.react";
import CustomPreviewComponent from "./CustomPreviewComponent.react";
import CustomCampaignLinkComponent from "./CustomCampaignLinkComponent.react";
import CustomCampaignActionComponent from
  "./CustomCampaignActionComponent.react";
import {resultsEmpty} from "../../../utils/UserAlerts.js";

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
    "columnName": "status",
    "order": 4,
    "locked": true,
    "visible": true,
    "displayName": "Status",
    "sortable": false,
    "cssClassName" : ""
  }, {
    "columnName": "replies",
    "order": 5,
    "locked": true,
    "visible": true,
    "displayName": "Replies",
    "cssClassName": "replies",
    "sortable": false
  }, {
    "columnName": "progress",
    "order": 6,
    "locked": true,
    "visible": true,
    "displayName": "Progress",
    "sortable": false,
    "cssClassName" : ""
  }, {
    "columnName": "action",
    "order": 7,
    "locked": true,
    "visible": true,
    "displayName": "Actions",
    "sortable": false,
    "cssClassName" : "",
    "customComponent": CustomCampaignActionComponent
  }];

class CampaignGrid extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isResultEmpty: true,
      noDataMessage: resultsEmpty.allCampaigns
    };
  }

  getCustomGridFilterer = (results, filter) => {
    const check = 0;
    const filteredData = _.filter(results, (result) => {
      const name = result.name;
      return (
        name.toString().toLowerCase().indexOf(filter.toLowerCase()) >= check
      );
    });
    this.setState({
      isResultEmpty: filteredData.length ? true : false,
      noDataMessage: resultsEmpty.allCampaignsOnSearch
    });
    return filteredData;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isResultEmpty: nextProps.results.length ? true : false
    });
  }

  render() {
    const hideHeader = this.state.isResultEmpty ? "" : "all-campaigns-list";
    return (
      <div className="row" id="campaign_list">
        <div className="container">
          <Griddle
            results={this.props.results}
            tableClassName={`responsive-table ${hideHeader}`}
            useGriddleStyles={false}
            columnMetadata={columnMeta}
            columns={["id", "name", "listSentTo",
              "status", "replies",
              "progress", "action"]}
            metadataColumns={[]}
            showPager={true}
            resultsPerPage="7"
            useCustomPagerComponent={true}
            customPagerComponent={CustomPagerComponent}
            showFilter={true}
            filterPlaceholderText="SEARCH CAMPAIGNS"
            useCustomFilterer={true}
            customFilterer={this.getCustomGridFilterer}
            noDataMessage={this.state.noDataMessage}
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
