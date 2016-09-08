import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import validatorUtil from "../../utils/ValidationMessages";
import CampaignStore from "../../stores/CampaignStore";
import CampaignActions from "../../actions/CampaignActions";
import {ErrorMessages} from "../../utils/UserAlerts";

class TestMail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      allTags: []
    };
    this.validatorTypes = {
      email: validatorUtil.email
    };
  }

  /**
   * Initialize the lean modal and custom scrollbar
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * Reset smart tag values on closing modal
   * Reset validations
   */
  resetState() {
    const setFields = {
      email: ""
    };
    this.state.allTags.map((tag) => {
      setFields[`tag_${tag.id}`] = "";
    });
    this.setState(setFields);
    this.props.clearValidations();
    this.el.find(".validate").removeClass("valid");
  }

  /**
   * Update the state variables with current smart tags
   * @param  {object} nextProps
   */
  componentWillReceiveProps(nextProps) {
    const subjectTags = CampaignStore.getAllUsedTags(nextProps.emailSubject);
    const bodyTags = CampaignStore.getAllUsedTags(nextProps.emailContent);
    let allTags = subjectTags.concat(bodyTags);
  //http://stackoverflow.com/questions/9923890/removing-duplicate-objects-with-underscore-for-javascript
    allTags = _.uniq(allTags, (tag, id) => {
      return tag.id;
    });
    const setFields = {
      allTags: allTags
    };
    let validatorTypes = this.validatorTypes;
    allTags.map((tag) => {
      setFields[`tag_${tag.id}`] = this.state[`tag_${tag.id}`] || "";
      validatorTypes[`tag_${tag.id}`] = validatorUtil.fieldName;
    });
    this.setState(setFields);
  }

  /**
   * Update state on input value change
   * @param  {SytheticEvent} event
   * @param  {String} field The field name
   */
  handleChange(event, field) {
    let state = {};
    state[field] = event.target.value;
    this.setState(state);
  }

  /**
   * Render the validation message if any
   * @param {String} el The field name
   * @param {String} label The label name
   * @return {ReactElement}
   */
  renderHelpText(el, label) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0].replace("field name", label)}
      </div>
    );
  }

  /**
   * Send state to validator
   * @return {object} this.state The state object
   */
  getValidatorData() {
    return this.state;
  }

  /**
   * Validate if fields are not empty
   */
  validateSmartTags() {
    const onValidate = error => {
      if (!error) {
        this.sendTestMail();
      }
    };
    this.props.validate(onValidate);
  }

  /**
   * Call actions to send test mail
   */
  sendTestMail() {
    const {emailContent, emailSubject} = this.props;
    const {email, allTags} = this.state;
    allTags.map((tag) => {
      tag.value = this.state[`tag_${tag.id}`];
    });
    const personInfo = {
      personFields: allTags
    };
    const contentWithTagsResolved =
      CampaignStore.applySmartTagsValue(emailContent, personInfo);
    const subjectWithTagsResolved =
      CampaignStore.applySmartTagsValue(emailSubject, personInfo);
    CampaignActions.sendTestMail({
      email:  email,
      subject: subjectWithTagsResolved.trim(),
      content: contentWithTagsResolved
    });
    this.el.find("#testMail").closeModal({
      complete: () => this.resetState()
    });
  }

  /**
   * Validate Email and subject content
   */
  validateEmail() {
    const {emailContent, emailSubject, errorCount} = this.props;
    if(errorCount){
      displayError(ErrorMessages.SmartTagIssuesInMainEmail);
    } else if(!emailContent.trim()) {
      displayError(ErrorMessages.EmptyEmailContent);
    } else if (!emailSubject.trim()) {
      displayError(ErrorMessages.EMPTY_SUBJECT);
    } else {
      this.el.find("#testMail").openModal({
        dismissible: false,
        complete: () => this.resetState()
      });
    }
  }

  /**
   * render
   * @return {ReactElement}
   */
  render() {
    const {emailContent, emailSubject} = this.props;
    const {allTags, email} = this.state;
    return (
      <div className="test-mail-container ">
        <div className="send-test-mail right-align"
          onClick={() => this.validateEmail()}>
          Send a test email
        </div>
        <div id="testMail" className="modal modal-fixed-header modal-fixed-footer lg-modal">
          <a className="modal-action modal-close" to="#!">
            <i className="mdi mdi-close" ></i>
          </a>
          <div className="modal-header">
            <div className="head">Test email</div>
          </div>
          <div className="modal-content">
            <div>
              <div className="input-field">
                <input id="testEmailID" type="text"
                  onChange={(e) => this.handleChange(e, "email")}
                  onBlur={this.props.handleValidation("email")}
                  value={email}
                  className="validate" />
                <label htmlFor="testEmailID"
                  className={email ? "active" : ""}>
                  To
                </label>
                {
                  !this.props.isValid("email")
                    ? this.renderHelpText("email")
                    : null
                }
              </div>
              {
                allTags.map((tag, key) => {
                  const fieldName = `tag_${tag.id}`;
                  return (
                    <div key={key} className="input-field">
                      <input id={fieldName} type="text"
                        onChange={(e) => this.handleChange(e, fieldName)}
                        onBlur={this.props.handleValidation(fieldName)}
                        value={this.state[fieldName]}
                        className="validate" />
                      <label htmlFor={fieldName}
                        className={this.state[fieldName] ? "active" : ""}>
                        {tag.field}
                      </label>
                      {
                        !this.props.isValid(fieldName)
                          ? this.renderHelpText(fieldName, tag.field)
                          : null
                      }
                    </div>
                  );
                }, this)
              }
            </div>
            <div className="content-wrapper">
              <label> Subject </label>
              <div className="content"
                dangerouslySetInnerHTML={{__html: emailSubject}} />
            </div>
            <div className="content-wrapper">
              <label> Email </label>
              <div className="content"
                dangerouslySetInnerHTML={{__html: emailContent}} />
            </div>
          </div>
          <div className="modal-footer">
            <div className="btn-container">
              <input type="button" onClick={() => this.validateSmartTags()}
                className="btn blue modal-action" value="Send" />
              <input type="button" value="Close"
                className="btn red modal-close modal-action p-1-btn" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TestMail.defaultProps = {
  emailContent: "",
  emailSubject: ""
};

export default validation(strategy)(TestMail);
