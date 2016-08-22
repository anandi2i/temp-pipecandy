import React from "react";
import ReactDOM from "react-dom";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import CampaignActions from "../../../actions/CampaignActions";
import validatorUtil from "../../../utils/ValidationMessages";

class UserTemplateForm extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.state = {
      templateName: "",
      templateContent: "",
      subjectRawText: ""
    };
    this.validatorTypes = {
      templateName: validatorUtil.templateName
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
    if(tinyMCE.get("new-content")) {
      tinyMCE.execCommand("mceRemoveEditor", true, "new-content");
    }
    this.initTinyMceEditors();
  }

  initTinyMceEditors = () => {
    initTinyMCE("#new-content", "#contentTools", "", "", true, this.tinyMceCb);
  }

  /**
   * Send state to validator
   * @return {object} this.state The state object
   */
  getValidatorData() {
    return this.state;
  }

  handleChange = (e) => {
    this.setState({
      templateName: e.target.value,
    });
  }

  saveNewTemplate = () => {
    const {subjectRawText, templateName, templateContent} = this.state;
    if(templateName.trim() === ""){
      displayError("Oops. It seems like you forgot to fill your\
        template name!");
    } else if(subjectRawText.trim() === ""){
      displayError("Oops. It seems like you forgot to fill your template!");
    } else {
      CampaignActions.saveUserTemplate({
        name: templateName,
        content: templateContent
      });
      this.closeModal();
    }
  }

  openModal = () => {
    this.el.openModal({
      dismissible: false
    });
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  closeModal = () => {
    tinyMCE.get("new-content").setContent("");
    this.el.find(".validate").removeClass("valid");
    $("#template-name").parent().find("label").removeClass("active");
    this.setState({
      templateName: "",
      templateContent: "",
      subjectRawText: ""
    }, () => this.el.closeModal());
  }

  tinyMceCb = (editor) => {
    let content = editor.getContent();
    this.setState({
      templateContent: content,
      subjectRawText: editor.getBody().textContent
    });
  }

  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }


  /**
   * render
   * @return {ReactElement} - Modal popup for Add/Edit recipient
   */
  render() {
    return (
      <div id="newTemplate" className="modal modal-fixed-header modal-fixed-footer">
        <i className="mdi mdi-close modal-close"></i>
        <div className="modal-header">
          <div className="head">
            {"New Template"}
          </div>
        </div>
        <div className="modal-content">
          <div className="row email-subject input-field m-lr-0">
            <label>{"Template Name"}</label>
            <input id="template-name" type="text" className="validate"
              value={this.state.templateName}
              onBlur={this.props.handleValidation("templateName")}
              onChange={this.handleChange} />
              {
                !this.props.isValid("templateName")
                  ? this.renderHelpText("templateName")
                  : null
              }
          </div>
          <div className="row email-content m-lr-0">
            <label>{"Template"}</label>
            <div className="row tiny-toolbar">
              <div className="tiny-toolbar-sub col s12 m6 l6" id="contentTools">
              </div>
            </div>
            <div id="new-content" className="email-body new-email-content inline-tiny-mce" />
          </div>
        </div>
        <div className="modal-footer">
          <div className="btn-container">
            <input type="button" value="Save"
              className="btn blue" onClick={() => this.saveNewTemplate()}/>
            <input type="button" value="Cancel"
              className="btn red modal-action modal-close"
              onClick={() => this.closeModal()}/>
          </div>
        </div>
      </div>
    );
  }
}

export default validation(strategy)(UserTemplateForm);
