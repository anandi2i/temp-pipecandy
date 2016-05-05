import React from "react";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";

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
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.setState({
      templates: CampaignStore.getAllEmailTemplates()
    });
    $(".modal-trigger").leanModal({
      dismissible: false
    });
    displayError(CampaignStore.getError());
  }

  selectTemplate(key, event) {
    this.setState((state) => ({
      activeTemplate: key,
      activeTemplateContent: state.templates[key].content
    }), () => {
      this.props.setTemplateContent();
    });

  }

  isActive(value){
    let isActive = (value === this.state.activeTemplate) ? "active" : "";
    return `card template-preview ${isActive}`;
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    let blankTemplateKey = 0;
    return (
      <div className="row" style={{display: isDisplay}}>
        {
          this.state.templates.map(function (template, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className={this.isActive(key)}
                  onClick={this.selectTemplate.bind(this, key)}>
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
        { this.state.templates.length ?
          <div id="previewTemplate" className="modal modal-fixed-header modal-fixed-footer">
            <i className="mdi mdi-close modal-close"></i>
            <div className="modal-header">
              <div className="head">Add Recipient</div>
            </div>
            <div className="modal-content">
              <div className="template-content gray-bg p-10">
                <div dangerouslySetInnerHTML={{__html: this.state.activeTemplateContent}} />
              </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" value="Cancel"
                className="btn red modal-action modal-close p-1-btn" />
              <input type="button" value="Pick This Template"
                className="btn blue modal-action modal-close" />
            </div>
          </div>
        : null }
      </div>
    );
  }
}
export default SelectPreBuildTemplate;
