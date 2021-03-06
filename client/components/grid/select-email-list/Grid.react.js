import React from "react";
import {Link} from "react-router";
import _ from "underscore";
import Griddle from "griddle-react";
import CustomRowComponent from "./CustomRowComponent.react";
import CustomPagerComponent from "../CustomGridPagination.react";
import CustomFilterComponent from "../CustomGridFilter.react";
import GridStore from "../../../stores/GridStore";
import {resultsEmpty} from "../../../utils/UserAlerts.js";

class SelectEmailListGrid extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedRowIds: GridStore.getSelectedEmailListIds() || [],
      isResultEmpty: true,
      noDataMessage: <div> Dang! You don't seem to have any email list here. Do
      you want to <Link to="/list/create/"> add a new list </Link> ? </div>
    };
  }

  //Reset the maxpage to null
  componentWillUnmount() {
    GridStore.resetMaxPage();
  }

  getCustomGridFilterer = (results, filter) => {
    // customfilter only filter the list name
    // result.name means the listname
    const check = 0;
    const filteredData = _.filter(results, (result) => {
      let name = result.name;
      return (
        name.toString().toLowerCase().indexOf(filter.toLowerCase()) >= check
      );
    });
    this.setState({
      isResultEmpty: filteredData.length ? true : false,
      noDataMessage: resultsEmpty.allListsOnSearch
    });
    if(results.length === filteredData.length) {
      GridStore.resetMaxPage(filteredData.length);
    } else {
      GridStore.setMaxPage(filteredData.length);
    }
    return filteredData;
  }

  toggleSelectRow = (row, isChecked) => {
    if(this.props.module === "campaignRun" && !row.membersCount) {
      return;
    }
    let selectedRowIds = this.state.selectedRowIds;
    if (isChecked) {
      let isFound = _.find(selectedRowIds, (id) => {
        return row.id === id;
      });
      if(_.isUndefined(isFound)) {
        selectedRowIds.push(row.id);
      }
    } else {
      let howMany = 1;
      selectedRowIds.splice(selectedRowIds.indexOf(row.id), howMany);
    }
    this.setState({
      selectedRowIds: selectedRowIds
    }, () => {
      GridStore.saveSelectedEmailListIds(this.state.selectedRowIds);
    });
  }

  getIsRowChecked = (row) => {
    let check = -1;
    return this.state.selectedRowIds.indexOf(row.id) > check ? true : false;
  }

  getGlobalData = () => {
    // Get the globalData from the prop
    let globalData,
      listLink = false;
    if(this.props.globalData !== null) {
      globalData = this.props.globalData();
      listLink = globalData.listLink;
    }
    return {
      listLink: listLink,
      toggleSelectRow: this.toggleSelectRow,
      getIsRowChecked: this.getIsRowChecked,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isResultEmpty: nextProps.results.length ? true : false
    });
  }

  render() {
    let resultsPerPage = 7;
    return (
      <Griddle
        results={this.props.results}
        metadataColumns={["id"]}
        useGriddleStyles={false}
        selectedRowIds={this.state.selectedRowIds}

        useCustomRowComponent={this.state.isResultEmpty}
        customRowComponent={CustomRowComponent}

        showPager={true}
        resultsPerPage={resultsPerPage}
        useCustomPagerComponent={true}
        customPagerComponent={CustomPagerComponent}

        showFilter={true}
        filterPlaceholderText="SEARCH BY LIST NAME"
        useCustomFilterComponent={true}
        customFilterComponent={CustomFilterComponent}
        useCustomFilterer={true}
        customFilterer={this.getCustomGridFilterer}
        globalData={this.getGlobalData}

        noDataMessage={this.state.noDataMessage}
        tableClassName={"all-email-list"} />
    );
  }

}

SelectEmailListGrid.defaultProps = {
  results: [],
  globalData: null
};

export default SelectEmailListGrid;
