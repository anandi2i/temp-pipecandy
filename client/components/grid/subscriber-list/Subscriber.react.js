import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import validatorUtil from "../../../utils/ValidationMessages";
import EmailListActions from "../../../actions/EmailListActions";

class Subscriber extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    /**
     * Initial person details
     * @property {number} id - The Id of the person
     * @property {String} firstName - The first name of the person
     * @property {String} middleName - The middle name of the person
     * @property {String} lastName - The last name of the person
     * @property {String} email - The email of the person
     * @property {array} listFields The listFields array
     * @author Ponvel G <ponnuvel@ideas2it.com>
     */
    this.initialPersonData = {
      id:"",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      listFields: []
    };
    this.state = this.initialPersonData;
    /**
     * To validate firstName, lastName, email
     */
    this.validatorTypes = {
      firstName: validatorUtil.firstName,
      lastName: validatorUtil.lastName,
      email: validatorUtil.email
    };
  }

  /**
   * Initialize the lean modal and custom scrollbar
   * @listens {EmailListStore} change event
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * Open modal for Add or Edit recipient
   * @param  {Object} subscriber - The list fields who is to be edit
   */
  openModal = (subscriber) => {
    this.setFields(subscriber);
    this.el.openModal({
      dismissible: false
    });
  }

  /**
   * Set fields for Add or Edit recipient
   * @property {Object} The subscriber details who is to be edit
   */
  setFields = (subscriber) => {
    const {listFields} = this.props;
    let fieldValues = {};
    if(subscriber) {
      fieldValues = subscriber.props.data;
    }
    const fields = {
      id: fieldValues.id || "",
      firstName: fieldValues.firstName || "",
      middleName: fieldValues.middleName || "",
      lastName: fieldValues.lastName || "",
      email: fieldValues.email || "",
      listFields: listFields
    };
    listFields.map((field) => {
      fields[field.name] = fieldValues[field.name] || "";
      this.initialPersonData[field.name] = fieldValues[field.name] || "";
    });
    this.setState(fields);
  }

  /**
   * Render the validation message if any
   * @param  {String} el The field name
   */
  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  /**
   * Set/Update the state variable on input value onChange
   * @param  {SytheticEvent} event
   * @param  {String} field The field name
   */
  setFieldValue(event, field) {
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
   * Submit the a single person object
   * @param  {boolean} addAnotherField True if add another person
   * @property {function} onValidate callback to execute after validation
   */
  onSubmit(addAnotherField) {
    const onValidate = error => {
      if (!error) {
        this.saveOrUpdate();
        if(!addAnotherField) {
          this.closeModal();
        }
      }
    };
    this.props.validate(onValidate);
  }

  /**
   * Construct single Person object and Call action to save/update
   * @property {object} person The person object
   * @property {array} fieldValues The additional fields value
   */
  saveOrUpdate() {
    const {id, firstName, middleName, lastName, email} = this.state;
    const {listId, listFields, peopleDetails} = this.props;
    const initialPersonData = this.initialPersonData;
    let personDetails = {};
    if(id) {
      personDetails = _.findWhere(peopleDetails, {id:id});
    }
    let fieldValues = [];
    listFields.map((field, key) => {
      let fieldValueId = null;
      if(this.state[field.name]){
        if(!_.isEmpty(personDetails.fieldValues)) {
          const fieldValue = _.findWhere(personDetails.fieldValues,
            {fieldId:field.id});
          if(fieldValue) {
            fieldValueId = fieldValue.id;
          }
        }
        const fieldDetails = {
          fieldId: field.id,
          value: this.state[field.name],
          listId: listId
        };
        if(fieldValueId) {
          fieldDetails.id = fieldValueId;
        }
        fieldValues.push(fieldDetails);
      }
    }, this);
    let person = {
      id: id,
      firstName: firstName,
      lastName: lastName,
      middleName: middleName,
      email: email,
      fieldValues: fieldValues
    };
    if(person.id) {
      EmailListActions.updateSinglePerson({
        listId: listId,
        person: {
          person : person
        }
      });
    } else {
      person = _.omit(person, "id");
      EmailListActions.saveSinglePerson({
        listId: listId,
        person: {
          person : person
        }
      });
    }
    this.props.clearValidations();
    this.el.find(".validate").removeClass("valid");
    initialPersonData.listFields = listFields;
    this.setState(initialPersonData);
  }

  /**
   * Call to close field modal and person modal
   */
  closeModal = () => {
    this.el.closeModal();
  }

  /**
   * Clear the validation when popup close
   */
  clearValidations = () => {
    this.props.clearValidations();
  }

  /**
   * render
   * @return {ReactElement} - Modal popup for Add/Edit recipient
   */
  render() {
    const currentState = this.state;
    return (
      <div id="subscriber"
        className="modal modal-fixed-header modal-fixed-footer mini-modal">
        <i className="mdi mdi-close modal-close" onClick={this.clearValidations}></i>
        <div className="modal-header">
          <div className="head">{currentState.id ? "Edit" : "Add"} Recipient</div>
        </div>
        <div className="modal-content">
          <div className="input-field">
            <input placeholder="First Name" id="firstName" type="text"
              onChange={(e) => this.setFieldValue(e, "firstName")}
              onBlur={this.props.handleValidation("firstName")}
              value={currentState.firstName}
              className="validate" />
            <label htmlFor="firstName" className={currentState.firstName ? "active" : ""}>First Name</label>
            {
              !this.props.isValid("firstName")
                ? this.renderHelpText("firstName")
                : null
            }
          </div>
          <div className="input-field">
            <input placeholder="Middle Name" id="middleName" type="text"
              onChange={(e) => this.setFieldValue(e, "middleName")}
              value={currentState.middleName}
              className="validate" />
            <label htmlFor="middleName" className={currentState.middleName ? "active" : ""}>Middle Name</label>
          </div>
          <div className="input-field">
            <input placeholder="Last Name" id="lastName" type="text"
              onChange={(e) => this.setFieldValue(e, "lastName")}
              onBlur={this.props.handleValidation("lastName")}
              value={currentState.lastName}
              className="validate" />
            <label htmlFor="lastName" className={currentState.lastName ? "active" : ""}>Last Name</label>
            {
              !this.props.isValid("lastName")
                ? this.renderHelpText("lastName")
                : null
            }

          </div>
          <div className="input-field">
            <input placeholder="Email" id="email" type="text"
              onChange={(e) => this.setFieldValue(e, "email")}
              onBlur={this.props.handleValidation("email")}
              value={currentState.email}
              className="validate" />
            <label htmlFor="email" className={currentState.email ? "active" : ""}>Email</label>
              {
                !this.props.isValid("email")
                  ? this.renderHelpText("email")
                  : null
              }
          </div>
          <div>
          {
            currentState.listFields.length ?
              currentState.listFields.map((list, key) => {
                const id = `${guid()}-${list.name}`;
                return (
                  <div key={key} className="input-field">
                    <input placeholder={list.name} id={id} type="text"
                      onChange={(e) => this.setFieldValue(e, list.name)}
                      value={currentState[list.name]}
                      className="validate" />
                    <label htmlFor={id} className={currentState[list.name] ? "active" : ""}>{list.name}</label>
                  </div>
                );
              }, this)
              : null
          }
          </div>
        </div>
        <div className="modal-footer">
          <div className="btn-container">
            {
              currentState.id ? null :
                <input type="button" onClick={() => this.onSubmit(true)} className="btn red modal-action" value="Add Another" />
            }
            <input type="button" onClick={() => this.onSubmit(false)} className="btn blue modal-action" value="OK" />
          </div>
        </div>
      </div>
    );
  }
}

export default validation(strategy)(Subscriber);
