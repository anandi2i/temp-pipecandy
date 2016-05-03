import React from "react";
import _ from "underscore";
import Griddle from "griddle-react";
import CustomRowComponent from "./CustomRowComponent.react";
import CustomPagerComponent from "../CustomGridPagination.react";
import CustomFilterComponent from "../CustomGridFilter.react";

class SelectEmailListGrid extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedRowIds: []
    };
  }

  getCustomGridFilterer = (results, filter) => {
    // customfilter only filter the list name
    // result.name means the listname
    let check = 0;
    return _.filter(results, (result) => {
      let name = result.name;
      return (
        name.toString().toLowerCase().indexOf(filter.toLowerCase()) >= check
      );
    });
  }

  toggleSelectRow = (row, isChecked) => {
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

  render() {
    let resultsPerPage = 7;
    return (
      <Griddle
        results={this.props.results}
        metadataColumns={["id"]}
        useGriddleStyles={false}
        selectedRowIds={this.state.selectedRowIds}

        useCustomRowComponent={true}
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
        globalData={this.getGlobalData} />
    );
  }

}

SelectEmailListGrid.defaultProps = {
  results: [],
  globalData: null
};

export default SelectEmailListGrid;
