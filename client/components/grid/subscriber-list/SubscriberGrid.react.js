import React from "react";
import validation from "react-validation-mixin";
import validatorUtil from "../../../utils/ValidationMessages";
import strategy from "joi-validation-strategy";
import Griddle from "griddle-react";
import CustomEditLinkComponent from "./CustomEditLinkComponent.react";
import CustomPagerComponent from "../CustomGridPagination.react";
import EmailListActions from "../../../actions/EmailListActions";

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
    "customComponent": CustomEditLinkComponent
  }];

class SubscriberGridView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      additionalFieldsLength: 5
    };
    this.validatorTypes = {
      firstName: validatorUtil.firstName,
      lastName: validatorUtil.lastName,
      email: validatorUtil.email
    };
  }

  componentDidMount() {
    $(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  closeModal = () => {
    $("#editSubbscriber").closeModal();
  }

  handleRowClick = (obj, eve) => {
    let propsData = obj.props.data;
    let addField1 = propsData.addField1.split(":");
    let addField2 = propsData.addField2.split(":");
    let addField3 = propsData.addField3.split(":");
    let addField4 = propsData.addField4.split(":");
    let addField5 = propsData.addField5.split(":");
    this.setState({
      personId: propsData.id,
      firstName: propsData.firstName,
      middleName: propsData.middleName,
      lastName: propsData.lastName,
      email: propsData.email,
      field1: addField1[0] || "",
      value1: addField1[1] || "",
      field2: addField2[0] || "",
      value2: addField2[1] || "",
      field3: addField3[0] || "",
      value3: addField3[1] || "",
      field4: addField4[0] || "",
      value4: addField4[1] || "",
      field5: addField5[0] || "",
      value5: addField5[1] || "",
    });
    if (eve.target.className === "icon" ||
        eve.target.nodeName === "I" &&
        eve.target.className === "mdi mdi-pencil") {
          eve.stopPropagation();
          $("#editSubbscriber").openModal();
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
  
  render() {
    return (
      <div className="row" id="subscriber_list">
        <div className="container">
          <Griddle
            results={this.props.results}
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
  listId: ""
};

export default validation(strategy)(SubscriberGridView);
