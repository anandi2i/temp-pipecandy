import React from "react";
import autobind from "autobind-decorator";
import Griddle from "griddle-react";
import EmailListStore from "../../stores/EmailListStore";
import EmailListActions from "../../actions/EmailListActions";

function getPeopleByList() {
  return EmailListStore.getPeopleByList();
}

class EditLinkComponent extends React.Component {
  render() {
    return (
      <a>
        <i className="mdi mdi-pencil"></i>
      </a>
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
      people: getPeopleByList(),
      listId: this.props[0].id
    };
  }

  componentDidMount() {
    $(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  @autobind
  closeModal() {
    $("#editSubbscriber").closeModal();
  }

  @autobind
  handleRowClick(obj, eve) {
    let propsData = obj.props.data;
    let addField1 = propsData.addField1.split(":");
    let addField2 = propsData.addField2.split(":");
    let addField3 = propsData.addField3.split(":");
    let addField4 = propsData.addField4.split(":");
    let addField5 = propsData.addField5.split(":");
    this.setState({
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

  @autobind
  getEditFieldState(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
  }

  @autobind
  onSubmit() {
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
      listId: this.state.listId,
      person: person
    };
    EmailListActions.updateSinglePerson(data);
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
		{/* Edit subscriber popup starts here */}
        <div id="editSubbscriber"
          className="modal modal-fixed-header modal-fixed-footer mini-modal">
          <i onClick={this.closeModal} className="mdi mdi-close"></i>
          <div className="modal-header">
            <div className="head">Edit Subbscriber</div>
          </div>
          <div className="modal-content">
            <div className="input-field">
              <input placeholder="First Name" type="text"
                onChange={this.getEditFieldState("firstName")}
                value={this.state.firstName}
                className="validate" />
              <label htmlFor="firstName" className="active">First Name</label>
            </div>
            <div className="input-field">
              <input placeholder="Middle Name" type="text"
                onChange={this.getEditFieldState("middleName")}
                value={this.state.middleName}
                className="validate" />
              <label htmlFor="lastName" className="active">Middle Name</label>
            </div>
            <div className="input-field">
              <input placeholder="Last Name" type="text"
                onChange={this.getEditFieldState("lastName")}
                value={this.state.lastName}
                className="validate" />
              <label htmlFor="lastName" className="active">Last Name</label>
            </div>
            <div className="input-field">
              <input placeholder="email" type="text"
                onChange={this.getEditFieldState("email")}
                value={this.state.email}
                className="validate" />
              <label htmlFor="lastName" className="active">email</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={this.getEditFieldState("field1")}
                value={this.state.field1}
                className="validate field-name" />
              <label className="active" htmlFor="field1">Field Name 1</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={this.getEditFieldState("value1")}
                value={this.state.value1}
                className="validate field-name" />
              <label className="active" htmlFor="value1">Value 1</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={this.getEditFieldState("field2")}
                value={this.state.field2}
                className="validate field-name" />
              <label className="active" htmlFor="field2">Field Name 2</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={this.getEditFieldState("value2")}
                value={this.state.value2}
                className="validate field-name" />
              <label className="active" htmlFor="value2">Value 2</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={this.getEditFieldState("field3")}
                value={this.state.field3}
                className="validate field-name" />
              <label className="active" htmlFor="field3">Field Name 3</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={this.getEditFieldState("value3")}
                value={this.state.value3}
                className="validate field-name" />
              <label className="active" htmlFor="value3">Value 3</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={this.getEditFieldState("field4")}
                value={this.state.field4}
                className="validate field-name" />
              <label className="active" htmlFor="field4">Field Name 4</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={this.getEditFieldState("value4")}
                value={this.state.value4}
                className="validate field-name" />
              <label className="active" htmlFor="value4">Value 4</label>
            </div>
            <div className="input-field">
              <input placeholder="Field Name" type="text"
                onChange={this.getEditFieldState("field5")}
                value={this.state.field5}
                className="validate field-name" />
              <label className="active" htmlFor="field5">Field Name 5</label>
            </div>
            <div className="input-field">
              <input placeholder="Value" type="text"
                onChange={this.getEditFieldState("value5")}
                value={this.state.value5}
                className="validate field-name" />
              <label className="active" htmlFor="value5">Value 5</label>
            </div>
          </div>
          <div className="modal-footer r-btn-container">
            <input type="button" onClick={this.closeModal} className="btn red modal-action p-1-btn" value="Cancel" />
            <input type="button" onClick={this.onSubmit} className="btn blue modal-action" value="Update" />
          </div>
		  {/* Edit subscriber popup ends here */}
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
