import React from "react";
import {Link} from "react-router";
import autobind from "autobind-decorator";
import Griddle from "griddle-react";
import EmailListStore from "../../stores/EmailListStore";

function getPeopleByList() {
  return EmailListStore.getPeopleByList();
}

class EditLinkComponent extends React.Component {
  render() {
    return (
      <Link to={`/email-list/${this.props.rowData.id}`}><i className="mdi mdi-pencil"></i></Link>
    );
  }
}

class GriddlePager extends React.Component {

  @autobind
  pageChange(key, event) {
    this.props.setPage(key);
  }

  render() {
    let options = [];
    let index = 0;
    let maxPerPage = 4;
    let maxPagerShow = 11;
    let minPagerShow = 10;
    let sumWithPage = 1;
    let startIndex = Math.max(this.props.currentPage - maxPerPage, index);
    let endIndex = Math.min(startIndex + maxPagerShow, this.props.maxPage);
    if (this.props.maxPage >= maxPagerShow &&
      (endIndex - startIndex) <= minPagerShow ) {
      startIndex = endIndex - maxPagerShow;
    }
    for(let i = startIndex; i < endIndex ; i++){
      let selected = this.props.currentPage === i ? "active" : "link";
      options.push(
        <li key={i} className={selected} data-value={i} onClick={this.pageChange.bind(this, i)}>
          {i + sumWithPage}
        </li>
      );
    }
    return (
      <ul className="pagination">
        <span>Page&nbsp;</span>
        {options}
      </ul>
    );
  }

}

let columnMeta = [{
    "columnName": "id",
    "locked": true,
    "visible": false
  }, {
    "columnName": "firstName",
    "order": 1,
    "locked": false,
    "visible": true,
    "displayName": "First Name",
    "cssClassName" : "name"
  }, {
    "columnName": "middleName",
    "order": 2,
    "locked": false,
    "visible": true,
    "displayName": "Middle Name",
    "cssClassName" : "name"
  }, {
    "columnName": "lastName",
    "order": 3,
    "locked": false,
    "visible": true,
    "displayName": "Last Name",
    "cssClassName" : "name"
  }, {
    "columnName": "email",
    "order": 4,
    "locked": false,
    "visible": true,
    "displayName": "e-mail",
    "cssClassName" : "email"
  }, {
    "columnName": "addField1",
    "order": 5,
    "locked": false,
    "visible": true,
    "displayName": "Data 1",
    "cssClassName" : "field"
  }, {
    "columnName": "addField2",
    "order": 6,
    "locked": false,
    "visible": true,
    "displayName": "Data 2",
    "cssClassName" : "field"
  }, {
    "columnName": "addField3",
    "order": 7,
    "locked": false,
    "visible": true,
    "displayName": "Data 3",
    "cssClassName" : "field"
  }, {
    "columnName": "addField4",
    "order": 8,
    "locked": false,
    "visible": true,
    "displayName": "Data 4",
    "cssClassName" : "field"
  }, {
    "columnName": "addField5",
    "order": 9,
    "locked": false,
    "visible": true,
    "displayName": "Data 5",
    "cssClassName" : "field"
  }, {
    "columnName": "edit",
    "order": 10,
    "locked": true,
    "visible": true,
    "displayName": "Edit",
    "cssClassName" : "icon",
    "sortable" : false,
    "customComponent": EditLinkComponent
  }];

class SubscriberGridView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      people: getPeopleByList()
    };
  }

  @autobind
  handleRowClick(obj, eve) {
    if (eve.target.className === "icon" ||
        eve.target.nodeName === "I" &&
        eve.target.className === "mdi mdi-pencil") {
      eve.stopPropagation();
    }
  }

  render() {
    return (
      <div className="row" id="subscriber_list">
        <div className="col s12">
          <Griddle
            results={this.state.people}
            tableClassName="responsive-table"
            useGriddleStyles={false}
            columnMetadata={columnMeta}
            columns={["firstName", "middleName", "lastName",
              "email", "addField1", "addField2", "addField3",
              "addField4", "addField5", "edit"]}
            onRowClick={this.handleRowClick}
            metadataColumns={["id"]}
            isMultipleSelection={true}
            uniqueIdentifier="id"
            showPager={true}
            resultsPerPage="4"
            useCustomPagerComponent={true}
            customPagerComponent={GriddlePager}
            showFilter={true}
            filterPlaceholderText="SEARCH BY NAME OR EMAIL"
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

GriddlePager.defaultProps = {
  "maxPage": 0,
  "nextText": "",
  "previousText": "",
  "currentPage": 0
};

export default SubscriberGridView;
