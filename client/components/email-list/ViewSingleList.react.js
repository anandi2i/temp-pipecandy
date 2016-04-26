import React from "react";
import {Link} from "react-router";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import _ from "underscore";
import validatorUtil from "../../utils/ValidationMessages";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import SubscriberGrid from "../grid/SubscriberGrid.react";

function getEmailListByID() {
  return EmailListStore.getEmailListByID();
}

class ListView extends React.Component {
  constructor(props) {
    super(props);
    this.initialStateValues = {
      emailList: getEmailListByID(),
      names: [],
      additionalFieldLen : 5,
      firstName: "",
      middleName: "",
      lastName: "",
      email: ""
    };
    this.state = {
      addAnother: false
    };
    this.state = this.initialStateValues;
    this.validatorTypes = {
      firstName: validatorUtil.firstName,
      lastName: validatorUtil.lastName,
      email: validatorUtil.email
    };
  }

  componentDidMount() {
    EmailListActions.getEmailListByID(this.props.params.listId);
    EmailListStore.addChangeListener(this.onStoreChange);
    $(".modal-trigger").leanModal({
      dismissible: false
    });
    $(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let error = EmailListStore.getError();
    if(error) {
      displayError(error);
      return false;
    }
    let success = EmailListStore.getSuccess();
    if(success) {
      displaySuccess(success);
    }
    let emailList = getEmailListByID();
    this.setState({
      emailList: emailList,
      listName: emailList[0].name
    });
    return true;
  }

  addMoreFields = () => {
    let getLength = this.state.names.length;
    let maxLength = 5;
    if(getLength < maxLength){
      this.state.names.push(getLength);
      this.forceUpdate();
    }
  }

  getFieldState(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
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
    const onValidate = error => {
      for(let i = 1; i <= this.state.additionalFieldLen; i++) {
        let field = this.state["field" + i];
        let value = this.state["value" + i];
        if((field && value) || (!field && !value)) {
          $(this).find(".warning-block").addClass("hide");
        } else {
          $(this).find(".warning-block").removeClass("hide");
          error = true;
        }
      }
      if (error) {
        //form has errors; do not submit
      } else {
        this.constructPersonDataAndSave();
      }
    };
    this.props.validate(onValidate);
  }

  onSubmitAnother = () => {
    this.setState({
      addAnother: true
    });
    this.onSubmit();
  }

  constructPersonDataAndSave() {
    let person = {
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      middleName: this.state.middleName,
      email: this.state.email
    };
    for(let i = 1; i <= this.state.additionalFieldLen; i++) {
      let field = this.state["field" + i];
      let value = this.state["value" + i];
      if(field && value) {
        person["field" + i] = field;
        person["value" + i] = value;
      }
    }
    let data = {
      listId: this.props.params.listId,
      person: person
    };
    EmailListActions.saveSinglePerson(data);
    this.setState(this.initialStateValues);
    this.props.clearValidations();
    $(".validate").removeClass("valid");
    if(this.state.addAnother) {
      this.setState({
        addAnother: false
      });
    } else {
      this.closeModal;
    }
  }

  closeModal = () => {
    $("#addEmail").closeModal();
  }

  openDialog = () => {
    $("#fileUpload").click();
  }

  fileChange = (e) => {
    let file = e.target.files[0];
    let fileExt = _.last(file.name.split("."));
    let acceptableFileTypes = ["csv", "xls", "xlsx"];
    const timeToShow = 4000;
    if(!file) {
      return false;
    }
    if(_.contains(acceptableFileTypes, fileExt)) {
      let fileObj = new FormData();
      fileObj.append("file", file);
      let data = {
        fileObj: fileObj,
        listId: this.props.params.listId
      };
      EmailListActions.uploadFile(data);
    } else {
      Materialize.toast("Please upload file of type csv/xls", timeToShow);
    }
    return true;
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">{this.state.listName}</div>
            <div className="sub-head">
              <Link to="/list">Back to Email Lists</Link>
            </div>
          </div>
          <div className="row r-btn-container m-lr-0">
            <a className="btn btn-dflt blue sm-icon-btn p-1-btn dropdown-button" data-activates="addDropDown">
              <i className="left mdi mdi-account-plus"></i> ADD
              <i className="right mdi mdi-chevron-down"></i>
            </a>
            <ul id="addDropDown" className="dropdown-content">
              <li><a className="modal-trigger" href="#addEmail">Add Subbscriber</a></li>
              <li><a href="#">Samle content</a></li>
            </ul>
            <input id="fileUpload" type="file" className="hide" name="file"
              accept=".csv, .xls, .xlsx" onChange={this.fileChange} />
            <div className="btn btn-dflt blue sm-icon-btn" onClick={this.openDialog}>
              <i className="left mdi mdi-upload"></i> add from file
            </div>
          </div>
          <div id="addEmail"
            className="modal modal-fixed-header modal-fixed-footer mini-modal">
            <i className="mdi mdi-close modal-close"></i>
            <div className="modal-header">
              <div className="head">Add Subbscriber</div>
            </div>
            <div className="modal-content">
              <div className="input-field">
                <input placeholder="First Name" id="firstName" type="text"
                  onChange={(e) => this.getFieldState(e, "firstName")}
                  onBlur={this.props.handleValidation("firstName")}
                  value={this.state.firstName}
                  className="validate" />
                <label htmlFor="firstName">First Name</label>
                {
                  !this.props.isValid("firstName")
                  ? this.renderHelpText("firstName")
                  : null
                }
              </div>
              <div className="input-field">
                <input placeholder="Middle Name" id="middleName" type="text"
                  onChange={(e) => this.getFieldState(e, "middleName")}
                  value={this.state.middleName}
                  className="validate" />
                <label htmlFor="middleName">Middle Name</label>
              </div>
              <div className="input-field">
                <input placeholder="Last Name" id="lastName" type="text"
                  onChange={(e) => this.getFieldState(e, "lastName")}
                  onBlur={this.props.handleValidation("lastName")}
                  value={this.state.lastName}
                  className="validate" />
                <label htmlFor="lastName">Last Name</label>
                {
                  !this.props.isValid("lastName")
                  ? this.renderHelpText("lastName")
                  : null
                }

              </div>
              <div className="input-field">
                <input placeholder="Email" id="email" type="text"
                  onChange={(e) => this.getFieldState(e, "email")}
                  onBlur={this.props.handleValidation("email")}
                  value={this.state.email}
                  className="validate" />
                <label htmlFor="email">Email</label>
                  {
                    !this.props.isValid("email")
                    ? this.renderHelpText("email")
                    : null
                  }
              </div>
              <div className="newFieldContainer">
                <div className={this.state.names.length ? "show" : "hide"}>
                  <div className="row m-lr-0 m-t-20 m-b-50">
                    <div className="gray-head">Additional Fields</div>
                  </div>
                </div>
                {
                  this.state.names.map($.proxy(function (value, key) {
                    let minLen = 1;
                    let getLen = key + minLen;
                    let keyId = "field" + getLen;
                    let valueId = "value" + getLen;
                    return (
                      <div className="row m-lr-0 field-val-wrapper" key={getLen}>
                        <div className="input-field">
                          <input placeholder="Field Name" id={keyId} type="text"
                            onChange={(e) => this.getFieldState(e, keyId)}
                            className="validate field-name" />
                          <label className="active" htmlFor={keyId}>{"Field Name " + getLen}</label>
                        </div>
                        <div className="input-field">
                          <input placeholder="Value" id={valueId} type="text"
                            onChange={(e) => this.getFieldState(e, valueId)}
                            className="validate field-value" />
                          <label className="active" htmlFor={valueId}>{"Value " + getLen}</label>
                        </div>
                        <div className="warning-block hide"> Field or Value should not be empty </div>
                      </div>
                    );
                  }, this))
                }
              </div>
              <div className={this.state.names.length < this.state.additionalFieldLen ? "show" : "hide"}>
                <div onClick={this.addMoreFields} className="add-new-field">
                  <i className="mdi mdi-plus-circle"></i> Add a new fields
                </div>
              </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" onClick={this.onSubmitAnother} className="btn red modal-action p-1-btn" value="Add Another" />
              <input type="button" onClick={this.onSubmit} className="btn blue modal-action" value="OK" />
            </div>
          </div>
        </div>
        {
          this.state.emailList.length
            ?
              <SubscriberGrid {...this.state.emailList} />
            : ""
        }
      </div>
    );
  }
}

export default validation(strategy)(ListView);
