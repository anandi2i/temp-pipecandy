import React from "react";
import ReactDOM from "react-dom";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
import {SuccessMessages} from "../../utils/UserAlerts";
import UserTemplateForm from "../grid/campaign-list/UserTemplateForm.react";

class SelectMyTemplate extends React.Component {
  constructor(props) {
    super(props);
    CampaignActions.getAllUserTemplates();
    this.state = {
      templates: [],
      innerTabIndex: 1,
      activeTemplate: 0,
      activeTemplateContent: ""
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  createTemplate = () => {
    this.refs.UserTemplateForm.refs.component.openModal();
  }

  onStoreChange = () => {
    this.setState({
      templates: CampaignStore.getAllUserTemplates()
    });
    this.el.find(".modal-trigger").leanModal({
      dismissible: false
    });
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
    displayError(CampaignStore.getError());
  }

  selectUserTemplate(key) {
    this.setState((state) => ({
      activeTemplate: key,
      activeTemplateContent: this.state.templates[key].content
    }), () => {
      this.props.setTemplateContent(this.state.templates[key].content);
    });
    displaySuccess(SuccessMessages.successSelectTemplate
      .replace("$selectedTemplate", `<strong>
      ${this.state.templates[key].name}</strong>`));
  }

  isActive(value){
    let isActive = (value === this.state.activeTemplate) ? "active" : "";
    return `card template-preview ${isActive}`;
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    const {templates, activeTemplate, activeTemplateContent} = this.state;
    return (
      <div className="row" style={{display: isDisplay}}>
        <div className="col s12 m6 l4">
          <a className="card-action" onClick={() => this.createTemplate()}>
            <div className="card">
              <div className="create-template">
                <span>Create new template <br/>
                  <i className="mdi mdi-plus"></i>
                </span>
              </div>
            </div>
          </a>
        </div>
        {
          templates.map(function (template, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className={this.isActive(key)}
                  onClick={() => this.selectUserTemplate(key)}>
                  <div className="card-title">{template.name}</div>
                  <div className="card-content">
                    <div dangerouslySetInnerHTML={{__html: template.content}} />
                  </div>
                  <a className="card-action modal-trigger"
                    href="#previewMyTemplate">
                    <i className="mdi mdi-eye"></i> Pick &amp; Preview
                  </a>
                </div>
              </div>
            );
          }, this)
        }
        {/* Email template preview modal popup starts here*/}
        { templates.length ?
          <div id="previewMyTemplate" className="modal modal-fixed-header modal-fixed-footer">
            <i className="mdi mdi-close modal-close"></i>
            <div className="modal-header">
              <div className="head">
                {templates[activeTemplate].name}
              </div>
            </div>
            <div className="modal-content">
              <div className="template-content gray-bg p-10">
                <div dangerouslySetInnerHTML={{__html: activeTemplateContent}} />
              </div>
            </div>
            <div className="modal-footer">
              <div className="btn-container">
                <input type="button" value="Close"
                  className="btn red modal-action modal-close" />
              </div>
            </div>
          </div>
        : null }
        <UserTemplateForm ref="UserTemplateForm"/>
      </div>
    );
  }
}
export default SelectMyTemplate;
