import React from "react";
import ReactDOM from "react-dom";
import {Link} from "react-router";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import _ from "underscore";
import Spinner from "../Spinner.react";
import validatorUtil from "../../utils/ValidationMessages";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import SubscriberGrid from "../grid/subscriber-list/SubscriberGrid.react";
import {ErrorMessages} from "../../utils/UserAlerts";
import Autosuggest from "react-autosuggest";

/**
 * ListView component to render single list data
 * Add field and Person
 * Upload People data
 */
class ListView extends React.Component {
  /**
   * constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    /**
     * Initial state values
     * @property {string} listName The name of the list
     * @property {array} people The people array
     * @property {string} firstName The first name of the person
     * @property {string} middleName The middle name of the person
     * @property {string} lastName The last name of the person
     * @property {string} email The email id of the person
     * @property {boolean} spinning Let the spinner be stopped at first
     * @property {string} fieldName The name of the additional field
     * @property {array} suggestions The values that match the input field
     * @property {array} metaFields The metaFields array
     * @property {array} listFields The listFields array
     * @author Dinesh R <dinesh.r@ideas2it.com>
     */
    this.initialStateValues = {
      listName: "",
      people: [],
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      spinning: true,
      fieldName: "",
      suggestions: [],
      metaFields: [],
      listFields: []
    };
    this.state = this.initialStateValues;
    this.validatorTypes = {
      firstName: validatorUtil.firstName,
      lastName: validatorUtil.lastName,
      email: validatorUtil.email,
      fieldName: validatorUtil.fieldName
    };
  }

  /**
   * Initialize the lean modal and custom scrollbar
   * @listens {EmailListStore} change event
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    EmailListActions.getEmailListByID(this.props.params.listId);
    EmailListStore.addChangeListener(this.onStoreChange);
    EmailListStore.addPersonChangeListener(this.onPersonChange);
    EmailListStore.addFieldsListener(this.getFieldsFromStore);
    this.el.find(".modal-trigger").leanModal({
      dismissible: false
    });
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * clean up event listener
   */
  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onStoreChange);
    EmailListStore.removePersonChangeListener(this.onPersonChange);
    EmailListStore.removeFieldsListener(this.getFieldsFromStore);
  }

  /**
   * Update the state varaiables on store change
   * @property {String} error Error message
   * @property {String} success Success message
   * @property {Object} gridUpdate Make spinning false as default
   * @property {Object} emailList The email List object
   */
  onStoreChange = () => {
    const error = EmailListStore.getError();
    if(error) {
      displayError(error);
      return false;
    }
    const success = EmailListStore.getSuccess();
    if(success) {
      displaySuccess(success);
    }
    let emailList = EmailListStore.getEmailListByID();
    let setFields = {
      listName: emailList.name,
      people: emailList.peoples,
      fieldsName: emailList.fieldsName,
      listFields: emailList.listFields,
      spinning: false
    }
    _.each(emailList.listFields, (list) => {
      setFields[list.name] = "";
      this.initialStateValues[list.name] = "";
    });
    this.setState(setFields);
  }

  /**
   * Update the state variables on people change from store
   * @property {Object} emailList THe email list object
   */
  onPersonChange = () => {
    let emailList = EmailListStore.getPeopleByListUpdated();
    if(emailList.length) {
      this.setState({
        people: emailList[0].peoples
      });
    }
  }

  /**
   * Update the state variable on input value onChange
   * @param  {SytheticEvent} event
   * @param  {String} field The field name
   */
  getFieldState(event, field) {
    let state = {};
    state[field] = event.target.value;
    this.setState(state);
  }

  /**
   * Send state to validator
   * @return {object} this.state The state object
   */
  getValidatorData() {
    return this.state;
  }

  /**
   * Render the validation message if any
   * @param  {String} el THe field name
   */
  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  /**
   * Submit the a single person object
   * @param  {boolean} addAnotherField True if add another person
   * @property {function} onValidate callback to execute after validation
   */
  onSubmit(addAnotherField) {
    const onValidate = error => {
      const {firstName, lastName, email} = error;
      if (!(firstName || lastName || email)) {
        this.constructPersonDataAndSave();
        if(!addAnotherField) {
          this.closeModal();
        }
      }
    };
    this.props.validate(onValidate);
  }

  /**
   * Add new field or relate existing field
   * @param  {boolean} addAnotherField True if add another field
   * @property {function} onValidate callback to execute after validation
   */
  addField(addAnotherField) {
    const onValidate = error => {
      if(!error.fieldName) {
        this.saveAdditionalField();
        if(!addAnotherField) {
          this.closeModal();
        }
      }
    };
    this.props.validate(onValidate);
  }

  /**
   * Call action to save field based on new or existing field
   * @property {boolean} existingListField True if the field already exists in list
   * @property {boolean} existingMetaField True if the field already exists in meta
   */
  saveAdditionalField() {
    const userId = getCookie("userId");
    const {fieldName, listFields, metaFields} = this.state;
    const {listId} = this.props.params;
    const existingListField = _.chain(listFields)
      .pluck("name")
      .contains(fieldName)
      .value();
    const existingMetaField = _.chain(metaFields)
      .pluck("name")
      .contains(fieldName)
      .value();
    if(existingListField) {
      this.setState({
        fieldName : ""
      });
    } else if(existingMetaField) {
      EmailListActions.relateAdditionalField({
        id: listId,
        fk: _.findWhere(metaFields, {"name": fieldName}).id
      });
      this.setState(this.initialStateValues);
    } else {
      EmailListActions.saveAdditionalField({
        name: fieldName,
        type: "String",
        listId: listId,
        userId: userId
      });
      this.setState(this.initialStateValues);
    }
    this.el.find(".validate").removeClass("valid");
    this.props.clearValidations();
  }

  /**
   * Construct single Person object and Call action to save
   * @property {object} person The person object
   * @property {array} fieldValues The additional fields value
   */
  constructPersonDataAndSave() {
    const {firstName, lastName, middleName, email, listFields} = this.state;
    const {listId} = this.props.params;
    let initialStateValues = this.initialStateValues;
    const person = {
      firstName: firstName,
      lastName: lastName,
      middleName: middleName,
      email: email
    };
    let fieldValues = [];
    listFields.map((field, key) => {
      if(this.state[field.name]){
        fieldValues.push({
          fieldId: field.id,
          value: this.state[field.name],
          listId: listId
        });
      }
    }, this);
    EmailListActions.saveSinglePerson({
      listId: listId,
      person: {
        person : person,
        fieldValues: fieldValues
      }
    });
    this.props.clearValidations();
    this.el.find(".validate").removeClass("valid");
    initialStateValues.listFields = listFields;
    this.setState(initialStateValues);
  }

  /**
   * Call to close field modal and person modal
   */
  closeModal = () => {
    this.el.find("#addEmail").closeModal();
    this.el.find("#addField").closeModal();
  }

  /**
   * Trigger browse file on clicking add from file button
   */
  openDialog = () => {
    this.el.find("#fileUpload").click();
  }

  /**
   * Construct formData post file uplaod and call action to upload
   *
   * @param {SytheticEvent} e
   * @property {object} file The file object which file details
   * @property {string} fileExt The uploaded file extension
   * @property {array} acceptableFileTypes Extensions which are allowed
   * @property {number} timeToShow Time to display toast message
   */
  fileChange = (e) => {
    const file = e.target.files[0];
    const fileExt = _.last(file.name.split("."));
    const acceptableFileTypes = ["csv", "xls", "xlsx"];
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
      displayError(ErrorMessages.InValidFileType);
    }
    return true;
  }

/**
 * Delete selected persons from Email List
 *
 * @property {Array} ids - selected row ids to delete
 * @property {Number} listId - id of the email list
 * @property {Array} people - List of People present in the Email list
 */
  deleteSubscriber = () => {
    const ids = this.refs.selectedRowIds.refs.component.state.selectedRowIds;
    const listId = this.props.params.listId;
    if(ids.length) {
      const data = {
        listId : listId,
        peopleId : ids
      };
      EmailListActions.deletePersons(data);
    } else {
      displayError(ErrorMessages.DeletePerson);
    }
  }

  /**
   * Call action to retrieve fields for the list
   */
  getFields = () => {
    EmailListActions.getFields({
      listId : this.props.params.listId
    });
  }

  /**
   * Update listFields and metaFields state variable
   * @property {object} fields The field object
   * @property {object} setFields The fields that are to be set/update in state
   */
  getFieldsFromStore = () => {
    const fields = EmailListStore.getFieldsFromStore();
    const setFields = {};
    setFields.metaFields = fields.metaFields;
    setFields.listFields = fields.listFields;
    _.each(fields.listFields, (list) => {
      setFields[list.name] = "";
      this.initialStateValues[list.name] = "";
    });
    this.setState(setFields);
  }

  /**
   * Construct the matching fields
   * @param  {string} fieldName The input value of the field
   * @property {number} fieldLength The length of the field value
   * @property {number} index The starting index of the value
   * @return {array} suggestedValues The matched fields
   */
  getSuggestions = (fieldValue) => {
    fieldValue = fieldValue.trim().toLowerCase();
    const fieldLength = fieldValue.length;
    const index = 0;
    const suggestedValues = this.state.metaFields.filter(field =>
      field.name.toLowerCase().slice(index, fieldLength) === fieldValue
    );
    return suggestedValues || [];
  }

  onChange = (event, {newValue}) => {
    this.setState({
      fieldName: newValue
    });
  }

  onSuggestionsUpdateRequested = ({value}) => {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  }

  getSuggestionValue = (suggestion) => {
    return suggestion.name;
  }

  renderSuggestion = (suggestion) => {
    return (
      <span>{suggestion.name}</span>
    );
  }

  /**
   * Clear the validations
   */
  clearValidations = () => {
    this.props.clearValidations();
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    const {fieldName, suggestions, people} = this.state;
    const inputProps = {
      id: "fieldName",
      placeholder: "Field Name",
      value: fieldName,
      onChange: (event, fieldName) => this.onChange(event, fieldName),
      className: "validate"
    };
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
              <li><a className="modal-trigger" href="#addEmail" onClick={this.getFields}>Add Recipient</a></li>
              <li><a className="modal-trigger" href="#addField" onClick={this.getFields}>Add Field</a></li>
            </ul>
            <input id="fileUpload" type="file" className="hide" name="file"
              accept=".csv, .xls, .xlsx" onChange={this.fileChange} />
            <div className="btn btn-dflt blue sm-icon-btn" onClick={this.openDialog}>
              <i className="left mdi mdi-upload"></i> add from file
            </div>
            { people && people.length ?
                <div className="btn btn-dflt blue sm-icon-btn delete-button-margin" onClick={this.deleteSubscriber}>
                  <i className="left mdi mdi-delete"></i> DELETE
                </div>
              : ""
            }
          </div>
          {/* Add new field starts here */}
          <div id="addField" className="modal modal-fixed-header mini-modal">
            <i className="mdi mdi-close modal-close" onClick={this.clearValidations}></i>
            <div className="modal-header">
              <div className="head">Add Field</div>
            </div>
            <div className="modal-content">
              <div className="input-field">
                <Autosuggest suggestions={suggestions}
                  onSuggestionsUpdateRequested={
                    (fieldName) => this.onSuggestionsUpdateRequested(fieldName)
                  }
                  getSuggestionValue={this.getSuggestionValue}
                  renderSuggestion={this.renderSuggestion}
                  inputProps={inputProps} />
                  <label htmlFor="fieldName"></label>
                  {
                    !this.props.isValid("fieldName")
                    ? this.renderHelpText("fieldName")
                    : null
                  }
              </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" onClick={() => this.addField(true)} className="btn red modal-action p-1-btn" value="Add Another" />
              <input type="button" onClick={() => this.addField(false)} className="btn blue modal-action" value="Add" />
            </div>
          </div>
          {/* Add new field ends here */}
          {/* Add new person starts here */}
          <div id="addEmail"
            className="modal modal-fixed-header modal-fixed-footer mini-modal">
            <i className="mdi mdi-close modal-close" onClick={this.clearValidations}></i>
            <div className="modal-header">
              <div className="head">Add Recipient</div>
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
              <div>
              {
                this.state.listFields.length ?
                  this.state.listFields.map((list, key) => {
                    const id = `${guid()}-${list.name}`;
                    return (
                      <div key={key} className="input-field">
                        <input placeholder={list.name} id={id} type="text"
                          onChange={(e) => this.getFieldState(e, list.name)}
                          value={this.state[list.name]}
                          className="validate" />
                        <label htmlFor={id}>{list.name}</label>
                      </div>
                    );
                  }, this)
                  : null
              }
              </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" onClick={() => this.onSubmit(true)} className="btn red modal-action p-1-btn" value="Add Another" />
              <input type="button" onClick={() => this.onSubmit(false)} className="btn blue modal-action" value="OK" />
            </div>
          </div>
          {/* Add new person ends here */}
          <div className="spaced" style={{display: this.state.spinning ? "block" : "none"}}>
            <Spinner />
          </div>
        </div>
        {
          people && people.length ?
            <SubscriberGrid results={people}
              fieldsName={this.state.fieldsName}
              listFields={this.state.listFields}
              listId={this.props.params.listId} ref="selectedRowIds"/>
          :
            <div className="container">
              <div className="row card">
                <div className="col s12 center card-content">
                  <p>
                    People list seems to be empty. Could you please add ?
                  </p>
                </div>
              </div>
            </div>
        }
      </div>
    );
  }
}

export default validation(strategy)(ListView);
