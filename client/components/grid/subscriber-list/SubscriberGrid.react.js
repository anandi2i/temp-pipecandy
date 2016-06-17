import React from "react";
import ReactDOM from "react-dom";
import validation from "react-validation-mixin";
import validatorUtil from "../../../utils/ValidationMessages";
import strategy from "joi-validation-strategy";
import Griddle from "griddle-react";
import CustomEditLinkComponent from "./CustomEditLinkComponent.react";
import CustomPagerComponent from "../CustomGridPagination.react";
import EmailListActions from "../../../actions/EmailListActions";
import CustomSelectComponent from "./CustomSelectComponent.react";
import CustomSelectAllComponent from "./CustomSelectAllComponent.react";
import _ from "underscore";

/**
 * Render the people data for a list using react-griddle
 * Edit each and every person and update it
 */
class SubscriberGridView extends React.Component {
  constructor(props) {
    super(props);
    //TODO - Server side pagination, Now it take all persons from the eamil list
    let visibleRowIds = [];
    this.props.results.map(person => {
      visibleRowIds.push(person.id);
    });
    this.state = {
      additionalFieldsLength: 5,
      selectedRowIds: [],
      visibleRowIds: visibleRowIds
    };
    this.validatorTypes = {
      firstName: validatorUtil.firstName,
      lastName: validatorUtil.lastName,
      email: validatorUtil.email
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  closeModal = () => {
    this.el.find("#editSubbscriber").closeModal();
  }

  handleRowClick = (obj, eve) => {
    const {fieldsName} = this.props;
    const propsData = obj.props.data;
    let person = {
      personId: propsData.id,
      firstName: propsData.firstName,
      middleName: propsData.middleName,
      lastName: propsData.lastName,
      email: propsData.email
    };
    fieldsName.map(field => {
      person[field.name] = propsData[field.name] || "";
    });
    this.setState(person);
    if (eve.target.className === "icon" ||
        eve.target.nodeName === "I" &&
        eve.target.className === "mdi mdi-pencil") {
          eve.stopPropagation();
          this.el.find("#editSubbscriber").openModal();
    }
  }

  onChange(e, field) {
    let state = {};
    state[field] = e.target.value;
    this.setState(state);
  }

  getValidatorData() {
    return this.state;
  }

  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  onSubmit = () => {
    let person = {
      firstName: this.state.firstName,
      middleName: this.state.middleName,
      lastName: this.state.lastName,
      email: this.state.email,
      field1:this.state.field1,
      value1:this.state.value1,
      field2:this.state.field2,
      value2:this.state.value2,
      field3:this.state.field3,
      value3:this.state.value3,
      field4:this.state.field4,
      value4:this.state.value4,
      field5:this.state.field5,
      value5:this.state.value5
    };
    let data = {
      listId: this.props.listId,
      personId: this.state.personId,
      person: person
    };
    const onValidate = error => {
      for(let i = 1; i <= this.state.additionalFieldsLength; i++) {
        let field = this.state["field" + i];
        let value = this.state["value" + i];
        if((field && !value) || (!field && value)) {
          error = true;
        }
      }
      if (!error) {
        EmailListActions.updateSinglePerson(data);
        this.closeModal();
      }
    };
    this.props.validate(onValidate);
  }

  /**
   * Grid Meta Data
   *
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
        "cssClassName" : "email"
      }, {
        "columnName": "edit",
        "order": genericFields + fieldsName.length + nextField,
        "locked": true,
        "visible": true,
        "displayName": "Edit",
        "cssClassName" : "icon",
        "sortable" : false,
        "customComponent": CustomEditLinkComponent
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
   *
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
    this.setState({
      selectedRowIds: selectedRowIds
    });
  }

  /**
   * Toggle Custom Header Component(checkbox)
   * If the checkbox is checked, visible row ids assigned to selected row ids
   * If the checkbox is unchecked, the selected row ids make it empty
   *
   * @param  {Boolean} isChecked - Wheather the checkbox is checked or not
   * @property {Array} visibleRowIds - the rows which are visible on
   *   the Email list
   */
  toggleSelectAllRow = (isChecked) => {
    const {visibleRowIds} = this.state;
    if (isChecked) {
      this.setState({
        selectedRowIds : visibleRowIds
      });
    } else {
      this.setState({
        selectedRowIds : []
      });
    }
  }

  /**
   * Wheather the row is checked or not
   *
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
   *
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
   *
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

  render() {
    return (
      <div className="row" id="subscriber_list">
        <div className="container">
          <Griddle
            results={this.props.results}
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
        </div>
        {/* Edit subscriber popup starts here */}
        <div id="editSubbscriber"
          className="modal modal-fixed-header modal-fixed-footer mini-modal">
          <i className="mdi mdi-close modal-close"></i>
          <div className="modal-header">
            <div className="head">Edit Subbscriber</div>
          </div>
          <div className="modal-content">
            <div className="input-field">
              <input placeholder="First Name" id="firstName" type="text"
                onChange={(e) => this.onChange(e, "firstName")}
                onBlur={this.props.handleValidation("firstName")}
                value={this.state.firstName}
                className="validate" />
              <label htmlFor="firstName" className="active">First Name</label>
              {
                !this.props.isValid("firstName")
                ? this.renderHelpText("firstName")
                : null
              }
            </div>
            <div className="input-field">
              <input placeholder="Middle Name" type="text"
                onChange={(e) => this.onChange(e, "middleName")}
                value={this.state.middleName}
                className="validate" />
              <label htmlFor="middleName" className="active">Middle Name</label>
            </div>
            <div className="input-field">
              <input placeholder="Last Name" id="lastName" type="text"
                onChange={(e) => this.onChange(e, "lastName")}
                onBlur={this.props.handleValidation("lastName")}
                value={this.state.lastName}
                className="validate" />
              <label htmlFor="lastName" className="active">Last Name</label>
              {
                !this.props.isValid("lastName")
                ? this.renderHelpText("lastName")
                : null
              }
            </div>
            <div className="input-field">
              <input placeholder="email" id="email" type="text"
                onChange={(e) => this.onChange(e, "email")}
                onBlur={this.props.handleValidation("email")}
                value={this.state.email}
                className="validate" />
              <label htmlFor="email" className="active">email</label>
              {
                !this.props.isValid("email")
                ? this.renderHelpText("email")
                : null
              }
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={(e) => this.onChange(e, "field1")}
                value={this.state.field1}
                className={
                  !this.state.field1 && this.state.value1
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="field1">Field Name 1</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={(e) => this.onChange(e, "value1")}
                value={this.state.value1}
                className={
                  this.state.field1 && !this.state.value1
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="value1">Value 1</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={(e) => this.onChange(e, "field2")}
                value={this.state.field2}
                className={
                  !this.state.field2 && this.state.value2
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="field2">Field Name 2</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={(e) => this.onChange(e, "value2")}
                value={this.state.value2}
                className={
                  this.state.field2 && !this.state.value2
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="value2">Value 2</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={(e) => this.onChange(e, "field3")}
                value={this.state.field3}
                className={
                  !this.state.field3 && this.state.value3
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="field3">Field Name 3</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={(e) => this.onChange(e, "value3")}
                value={this.state.value3}
                className={
                  this.state.field3 && !this.state.value3
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="value3">Value 3</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={(e) => this.onChange(e, "field4")}
                value={this.state.field4}
                className={
                  !this.state.field4 && this.state.value4
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="field4">Field Name 4</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={(e) => this.onChange(e, "value4")}
                value={this.state.value4}
                className={
                  this.state.field4 && !this.state.value4
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="value4">Value 4</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={(e) => this.onChange(e, "field5")}
                value={this.state.field5}
                className={
                  !this.state.field5 && this.state.value5
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="field5">Field Name 5</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={(e) => this.onChange(e, "value5")}
                value={this.state.value5}
                className={
                  this.state.field5 && !this.state.value5
                  ? "invalid"
                  : "validate field-name"
                }/>
              <label className="active" htmlFor="value5">Value 5</label>
            </div>
          </div>
          <div className="modal-footer r-btn-container">
            <input type="button"className="btn red modal-action modal-close p-1-btn" value="Cancel" />
            <input type="button" onClick={this.onSubmit} className="btn blue modal-action" value="Update" />
          </div>
        </div>
        {/* Edit subscriber popup ends here */}
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
