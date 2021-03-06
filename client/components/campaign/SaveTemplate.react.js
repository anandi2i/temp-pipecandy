import React from "react";
import ReactDOM from "react-dom";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import validatorUtil from "../../utils/ValidationMessages";
import {ErrorMessages} from "../../utils/UserAlerts";
import CampaignStore from "../../stores/CampaignStore";

class SaveTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      templateName: "",
      isChange: false
    };
    this.validatorTypes = {
      templateName: validatorUtil.templateName
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    $(".modal-trigger").leanModal({
      dismissible: false
    });
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  /**
   * remove change listener
   */
  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    CampaignStore.getError() ? displayError(CampaignStore.getError())
      : $("#saveTemplateModal").closeModal();
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
   * @param {String} el The field name
   * @return {ReactElement}
   */
  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  /**
   * Update state on input value change
   * @param  {SytheticEvent} event
   * @param  {String} field The field name
   */
  handleChange(event, field) {
    let state = {};
    state[field] = event.target.value;
    state.isChange = true;
    this.setState(state);
  }

  /**
   * Get template name from user
   */
  getTemplateName() {
    const {emailRawText} = this.props;
    if(emailRawText.replace(/\u200B/g, "")){
      $("#saveTemplateModal").openModal();
    } else {
      displayError(ErrorMessages.EmptyEmailContent);
    }
  }

  /**
   * Save template name by user
   * @param {string} templateName
   */
  setTemplateName(templateName) {
    if(templateName.replace(/\u200B/g, "").trim()) {
      this.props.setTemplateName(templateName);
    } else {
      displayError(ErrorMessages.MISSING_TEMPLATE_NAME);
    }
    this.setState({templateName: ""});
    this.props.clearValidations();
  }

  /**
   * Close Template modal by user
   */
  closeTemplateModal() {
    this.setState({templateName: ""});
    this.props.clearValidations();
  }

  render() {
    const {templateName} = this.state;
    const validate = templateName ? "validate" : "";
    return (
      <div className="save-template-container">
        <a onClick={() => this.getTemplateName()} className="btn blue">Save</a>
        <div id="saveTemplateModal" className="modal modal-fixed-header mini-modal">
          <div className="modal-action modal-close" id="closeBtn">
            <i className="mdi mdi-close" onClick={
              () => this.closeTemplateModal()}></i>
          </div>
          <div className="modal-header">
            <div className="head">Save Template</div>
          </div>
          <div className="modal-content">
              <div className="input-field">
                <input id="templateName" type="text"
                  onChange={(e) => this.handleChange(e, "templateName")}
                  onBlur={this.props.handleValidation("templateName")}
                  value={templateName} className={`${validate}`}/>
                <label htmlFor="templateName"
                  className={templateName ? "active" : ""}>
                  Template Name
                </label>
                {
                  !this.props.isValid("templateName")
                    ? this.renderHelpText("templateName")
                    : null
                }
              </div>
          </div>
          <div className="modal-footer">
            <div className="btn-container">
              <input type="button" className="btn blue modal-action"
              value="Save" onClick={() => this.setTemplateName(templateName)} />
              <input type="button" value="Close"
                className="btn red modal-action modal-close p-1-btn"
                onClick={() => this.closeTemplateModal()}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default validation(strategy)(SaveTemplate);
