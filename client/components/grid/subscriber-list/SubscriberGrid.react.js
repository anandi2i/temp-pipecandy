import React from "react";
import ReactDOM from "react-dom";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import Griddle from "griddle-react";
import _ from "underscore";
import CustomEditLinkComponent from "./CustomEditLinkComponent.react";
import CustomPagerComponent from "../CustomGridPagination.react";
import CustomSelectComponent from "./CustomSelectComponent.react";
import CustomSelectAllComponent from "./CustomSelectAllComponent.react";
import Subscriber from "./Subscriber.react";
import EmailListActions from "../../../actions/EmailListActions";
import EmailListStore from "../../../stores/EmailListStore";
import CustomUnsubscribeComponent from "./CustomUnsubscribeComponent.react";
/**
 * Render the people data for a list using react-griddle
 */
class SubscriberGridView extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.state = {
      selectedRowIds: [],
      visibleRowIds: _.pluck(this.props.results, "id") || [],
      isSpinner: false
    };
  }

  /**
   * Update the visible row id on grid data change
   * @param  {object} nextProps
   */
  componentWillReceiveProps(nextProps) {
    this.setState({
      visibleRowIds: _.pluck(nextProps.results, "id")
    });
  }

  /**
   * Show the tooltip when user hovers on Unsubscribed email
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".tooltipped").tooltip({delay: 50});
    EmailListStore.addChangeListener(this.onStoreChange);
  }

  /**
   * clean up event listener
   */
  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onStoreChange);
  }

  /**
   * Stop spinner on store change
   */
  onStoreChange = () => {
    this.setState({
      isSpinner: false
    });
  }

  /**
   * Update state of spinner
   * @param {Boolean} isSpinner
   */
  spinner = (isSpinner) => {
    this.setState({
      isSpinner: isSpinner
    });
    this.props.spinner(isSpinner);
  }

  /**
   * Delete selected persons from Email List
   */
  deleteSubscriber = () => {
    const {selectedRowIds} = this.state;
    if(selectedRowIds.length) {
      const data = {
        listId: this.props.listId,
        peopleIds: selectedRowIds
      };
      EmailListActions.deletePersons(data);
      this.setState({
        selectedRowIds: []
      });
    } else {
      displayError(ErrorMessages.DeletePerson);
    }
  }

  /**
   * Handle edit grid row
   * @param  {Object} rowData - Contains the row data which is clicked
   * @param  {Object} event - The event which is performed
   */
  handleRowClick = (rowData, event) => {
    const {className, nodeName} = event.target;
    if(className === "icon" || nodeName === "I" &&
      className === "mdi mdi-pencil") {
          event.stopPropagation();
          this.editRecipient(rowData);
    }
  }

  /**
   * Open edit recipient
   * @param  {Object} rowData - Contains the row data which is to be edit
   */
  editRecipient = (rowData) => {
    this.refs.subscriber.refs.component.openModal(rowData);
  }

  /**
   * Grid Meta Data
   * @return {Array} - List of Objects that contains Column data and config
   */
  getColumnMeta = () => {
    const {fieldsName} = this.props;
    const genericFields = 5;
    const nextField = 1;
    let columnMeta = [{
        "columnName": "id",
        "locked": true,
        "visible": false
      }, {
        "columnName": "select",
        "order": 1,
        "locked": true,
        "visible": true,
        "cssClassName" : "select",
        "sortable" : false,
        "customHeaderComponent": CustomSelectAllComponent,
        "customHeaderComponentProps": this.getGlobalData(),
        "customComponent": CustomSelectComponent,
        "globalData": this.getGlobalData
      }, {
        "columnName": "firstName",
        "order": 2,
        "locked": false,
        "visible": true,
        "displayName": "First Name",
        "cssClassName" : "name"
      }, {
        "columnName": "middleName",
        "order": 3,
        "locked": false,
        "visible": true,
        "displayName": "Middle Name",
        "cssClassName" : "name"
      }, {
        "columnName": "lastName",
        "order": 4,
        "locked": false,
        "visible": true,
        "displayName": "Last Name",
        "cssClassName" : "name"
      }, {
        "columnName": "email",
        "order": 5,
        "locked": false,
        "visible": true,
        "displayName": "e-mail",
        "cssClassName" : "email",
        "customComponent": CustomUnsubscribeComponent
      }, {
        "columnName": "edit",
        "order": genericFields + fieldsName.length + nextField,
        "locked": true,
        "visible": true,
        "displayName": "Edit",
        "cssClassName" : "icon",
        "sortable" : false,
        "customComponent": CustomEditLinkComponent
      }, {
        "columnName": "isUnsubscribed",
        "locked": true,
        "visible": false,
        "cssClassName" : "isunsubscribed"
      }];
    fieldsName.map((field, index) => {
      columnMeta.push({
        "columnName": field,
        "order": genericFields + index + nextField,
        "locked": false,
        "visible": true,
        "displayName": field,
        "cssClassName" : "field"
      });
    });
    return columnMeta;
  }

  /**
   * Toggle Custom Row Component(Checkbox)
   * If the checkbox is checked, the row id added in the selectedRowIds
   * If the checkbox is unchecked, the row id removed from the selectedRowIds
   * @param  {Object}  row - The data of single row
   * @param  {Boolean} isChecked - Wheather the checkbox checked or not
   * @property {Array} selectedRowIds - List of ids selected from the Email list
   */
  toggleSelectRow = (row, isChecked) => {
    let selectedRowIds = this.state.selectedRowIds;
    if (isChecked) {
      let isFound;
      isFound = _.find(selectedRowIds, (id) => {
        return row.id === id;
      });
      if(!isFound) {
        selectedRowIds.push(row.id);
      }
    } else {
      let howMany = 1;
      selectedRowIds.splice(selectedRowIds.indexOf(row.id), howMany);
    }
    this.props.enableDelete(selectedRowIds.length ? true : false);
    this.setState({
      selectedRowIds: selectedRowIds
    });
  }

  /**
   * Toggle Custom Header Component(checkbox)
   * If the checkbox is checked, visible row ids assigned to selected row ids
   * If the checkbox is unchecked, the selected row ids make it empty
   * @param  {Boolean} isChecked - Wheather the checkbox is checked or not
   * @property {Array} visibleRowIds - the rows which are visible on
   *   the Email list
   */
  toggleSelectAllRow = (isChecked) => {
    const {visibleRowIds} = this.state;
    if (isChecked) {
      this.setState({
        selectedRowIds : _.clone(visibleRowIds)
      });
      this.props.enableDelete(true);
    } else {
      this.setState({
        selectedRowIds : []
      });
      this.props.enableDelete(false);
    }
  }

  /**
   * Wheather the row is checked or not
   * @param  {Object} row - The row of the email list(person)
   * @return {Boolean} - If the row id is present in the selectedRowIds,
   *   return true, else false
   */
  getIsRowChecked = (row) => {
    let check = -1;
    return this.state.selectedRowIds.indexOf(row.id) > check ? true : false;
  }

  /**
   * Wheather the header custom component(checkbox) checked or not
   * @return {Boolean} sort visibleRowIds and selectedRowIds and compare,
   *   if equal return true else false
   */
  getIsAllRowChecked = () => {
    const {visibleRowIds, selectedRowIds} = this.state;
    return _.isEqual(_.sortBy(visibleRowIds), _.sortBy(selectedRowIds));
  }

  /**
   * It is return Object of functions that are used to check or uncheck
   *   row from the email list. The functions are toggleSelectRow,
   *   toggleSelectAllRow, getIsRowChecked, getIsAllRowChecked
   * @return {Object} - Object of functions
   */
  getGlobalData = () => {
    return {
      toggleSelectRow: this.toggleSelectRow,
      getIsRowChecked: this.getIsRowChecked,
      toggleSelectAllRow: this.toggleSelectAllRow,
      getIsAllRowChecked: this.getIsAllRowChecked
    };
  }

  /**
   * render
   * @return {Griddle} - Grid using Griddle component
   */
  render() {
    const {listId, listFields, peopleDetails, results} = this.props;
    const {isSpinner} = this.state;
    return (
      <div className="row subscriber-list" id="subscriberList">
        <div className="container">
          {
            !isSpinner
              ? <Griddle
                results={results}
                tableClassName="responsive-table"
                useGriddleStyles={false}
                columnMetadata={this.getColumnMeta()}
                selectedRowIds={this.state.selectedRowIds}
                globalData={this.getGlobalData}
                onRowClick={this.handleRowClick}
                metadataColumns={["id"]}
                isMultipleSelection={false}
                uniqueIdentifier="id"
                showPager={true}
                resultsPerPage="10"
                useCustomPagerComponent={true}
                customPagerComponent={CustomPagerComponent}
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
              : null
          }
        </div>
        {/* Edit recipient component*/}
        <div>
          <Subscriber listId={listId}
            listFields={listFields}
            peopleDetails={peopleDetails}
            spinner={this.spinner}
            ref="subscriber" />
        </div>
        {/* /Edit recipient component*/}
      </div>
    );
  }
}

SubscriberGridView.defaultProps = {
  results: [],
  fieldsName: [],
  listFields: [],
  listId: ""
};

export default validation(strategy)(SubscriberGridView);
