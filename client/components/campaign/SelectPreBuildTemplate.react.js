import React from "react";
import ReactDOM from "react-dom";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
import {SuccessMessages} from "../../utils/UserAlerts";

class SelectPreBuildTemplate extends React.Component {
  constructor(props) {
    super(props);
    CampaignActions.getAllEmailTemplates();
    this.state = {
      templates: [],
      innerTabIndex: 0,
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

  onStoreChange = () => {
    this.setState({
      templates: CampaignStore.getAllEmailTemplates()
    });
    this.el.find(".modal-trigger").leanModal({
      dismissible: false
    });
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
    displayError(CampaignStore.getError());
  }

  selectTemplate(key) {
    this.setState((state) => ({
      activeTemplate: key,
      activeTemplateContent: state.templates[key].content
    }), () => {
      this.props.setTemplateContent();
    });
    displaySuccess(`${this.state.templates[key].name}
      ${SuccessMessages.successSelectTemplate}`);
  }

  isActive(value){
    let isActive = (value === this.state.activeTemplate) ? "active" : "";
    return `card template-preview ${isActive}`;
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    let blankTemplateKey = 0;
    const {templates, activeTemplate, activeTemplateContent} = this.state;
    return (
      <div className="row" style={{display: isDisplay}}>
        {
          templates.map(function (template, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className={this.isActive(key)}
                  onClick={() => this.selectTemplate(key)}>
                  <div className="card-title">{template.name}</div>
                  <div className="card-content">
                    <div dangerouslySetInnerHTML={{__html: template.content}} />
                  </div>
                  {
                    (key === blankTemplateKey)
                    ?
                      <div className="card-action">
                        <i className="mdi mdi-eye-off"></i> Preview
                      </div>
                    :
                      <div className="card-action modal-trigger"
                        href="#previewTemplate">
                        <i className="mdi mdi-eye"></i> Preview
                      </div>
                  }
                </div>
              </div>
            );
          }, this)
        }
        {/* Email template preview modal popup starts here*/}
        { templates.length ?
          <div id="previewTemplate" className="modal modal-fixed-header modal-fixed-footer">
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
      </div>
    );
  }
}
export default SelectPreBuildTemplate;
