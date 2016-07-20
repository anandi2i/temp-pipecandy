import React from "react";
import ReactDOM from "react-dom";
import {Link} from "react-router";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import _ from "underscore";
import Autosuggest from "react-autosuggest";
import Spinner from "../Spinner.react";
import validatorUtil from "../../utils/ValidationMessages";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import SubscriberGrid from "../grid/subscriber-list/SubscriberGrid.react";
import Subscriber from "../grid/subscriber-list/Subscriber.react";
import TagMenu from "../TagMenu.react";
import {ErrorMessages} from "../../utils/UserAlerts";

/**
 * ListView component to render single list data
 * Add field
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
     * @property {boolean} spinning Let the spinner be stopped at first
     * @property {string} fieldName The name of the additional field
     * @property {array} suggestions The values that match the input field
     * @property {array} metaFields The metaFields array
     * @property {array} listFields The listFields array
     */
    this.initialStateValues = {
      listName: "",
      people: [],
      spinning: true,
      fieldName: "",
      suggestions: [],
      metaFields: [],
      listFields: [],
      activeTabId: "original",
      tabs: [{
        id: "original",
        name: "ORIGINAL",
      },
      {
        id: "amplified",
        name: "AMPLIFIED",
      }]
    };
    this.state = this.initialStateValues;
    this.validatorTypes = {
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
    const emailList = EmailListStore.getEmailListByID();
    let setFields = {
      listName: emailList.name,
      people: emailList.people,
      fieldsName: emailList.fieldsName,
      listFields: emailList.listFields,
      spinning: false,
      peopleDetails: emailList.peopleDetails
    };
    this.setState(setFields);
  }

  /**
   * Update the state variables on people change from store
   * @property {Object} emailList THe email list object
   */
  onPersonChange = () => {
    const error = EmailListStore.getError();
    if(error) {
      displayError(error);
      return false;
    }
    const success = EmailListStore.getSuccess();
    if(success) {
      displaySuccess(success);
    }
    let emailList = EmailListStore.getPeopleByListUpdated();
    if(emailList.people.length) {
      this.setState({
        people: emailList.people,
        peopleDetails: emailList.peopleDetails
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
   * Add new field or relate existing field
   * @param  {boolean} addAnotherField True if add another field
   * @property {function} onValidate callback to execute after validation
   */
  addField(addAnotherField) {
    const onValidate = error => {
      if(!error) {
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
   * Call to close field modal and person modal
   */
  closeModal = () => {
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
 * @property {Array} ids - selected row ids to delete
 * @property {Number} listId - id of the email list
 * @property {Array} people - List of People present in the Email list
 */
  deleteSubscriber = () => {
    const ids = this.refs.subscriberGrid.refs.component.state.selectedRowIds;
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
   * Open add recipient modal
   */
  addRecipient = () => {
    this.refs.subscriber.refs.component.openModal();
  }

  /**
   * Clear validation when add field popup closed
   */
  clearValidations = () => {
    this.props.clearValidations();
  }

  /**
   * Handle tabs navigations
   * Call to load the Inbox mails
   * @param {string} index
   */
  handleClick = (tabId) => {
    this.setState({
      activeTabId: tabId
    }, () => {
      enabledropDownBtn();
    });
  }

  /**
   * render
   * @return {ReactElement} markup
   */
  render() {
    const {fieldName, suggestions, people,
      fieldsName, listFields, peopleDetails, activeTabId, tabs} = this.state;
    const {listId} = this.props.params;
    const inputProps = {
      id: "fieldName",
      placeholder: "Field Name",
      value: fieldName,
      onChange: (event, fieldName) => this.onChange(event, fieldName),
      className: "validate"
    };
    return (
      <div>
        <div className="container view-single-list-containter">
          <div className="row sub-head-container m-lr-0">
            <div className="head">{this.state.listName}</div>
            <div className="sub-head">
              <Link to="/list">Back to Email Lists</Link>
            </div>
          </div>
          {/*TODO need to clean - for demo purpose*/}
          { activeTabId === tabs[0].id
            ? <div className="row r-btn-container m-lr-0 email-list-action-btn">
                <a className="btn btn-dflt blue sm-icon-btn p-1-btn dropdown-button" data-activates="addDropDown">
                  <i className="left mdi mdi-account-plus"></i> Add
                  <i className="right mdi mdi-chevron-down"></i>
                </a>
                <ul id="addDropDown" className="dropdown-content">
                  <li><a onClick={this.addRecipient}>Add Recipient</a></li>
                  <li><a className="modal-trigger" href="#addField" onClick={this.getFields}>Add Field</a></li>
                  <li><Link to="/list/master-list">Build From Master</Link></li>
                </ul>
                <input id="fileUpload" type="file" className="hide" name="file"
                  accept=".csv, .xls, .xlsx" onChange={this.fileChange} />
                <a className="btn btn-dflt blue sm-icon-btn p-1-btn dropdown-button" onClick={this.openDialog}>
                  <i className="left mdi mdi-upload"></i> Add From File
                </a>
                <a href={`/api/file/list/${this.props.params.listId}/downloadCSV`}
                  className="btn btn-dflt blue sm-icon-btn p-1-btn"
                  download>
                  <i className="left mdi mdi-download"></i> Sample CSV
                </a>
                { people && people.length ?
                    <a className="btn btn-dflt blue sm-icon-btn dropdown-button" onClick={this.deleteSubscriber}>
                      <i className="left mdi mdi-delete"></i> Delete
                    </a>
                  : ""
                }
              </div>
            : ""
          }
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
          <div className="spaced" style={{display: this.state.spinning ? "block" : "none"}}>
            <Spinner />
          </div>
        </div>
        <TagMenu activeTabId={activeTabId} tabs={tabs}
          handleClick={this.handleClick} mainClass={"container"} />
        { /*TODO need to clean - for demo purpose*/
          activeTabId
            ? people && people.length ?
                <SubscriberGrid results={people}
                  fieldsName={fieldsName}
                  listFields={listFields}
                  listId={listId}
                  peopleDetails={peopleDetails}
                  ref="subscriberGrid" />
              :
                !this.state.spinning ?
                  <div className="container">
                    <div className="row card">
                      <div className="col s12 center card-content">
                        <p>
                          People list seems to be empty. Could you please add ?
                        </p>
                      </div>
                    </div>
                  </div>
                : ""
            : ""
        }
        {/* Add Recipient Component */}
        <div>
          <Subscriber listId={listId}
            listFields={listFields}
            peopleDetails={peopleDetails}
            ref="subscriber" />
        </div>
        {/* /Add Recipient Component */}
      </div>
    );
  }
}

export default validation(strategy)(ListView);
