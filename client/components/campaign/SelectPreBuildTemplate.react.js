import React from "react";
import autobind from "autobind-decorator";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";

class SelectPreBuildTemplate extends React.Component {
  constructor(props) {
    super(props);
    CampaignActions.getAllEmailTemplates();
    this.state={
      templates: [],
      innerTabIndex: 0,
      activeTemplate: 0,
      activeTemplateContent: ""
    };
  }

  componentDidMount() {
    CampaignStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this._onChange);
  }

  @autobind
  closeModal() {
    $("#previewTemplate").closeModal();
  }

  @autobind
  _onChange() {
    this.setState({
      templates: CampaignStore.getAllEmailTemplates()
    });
    $(".modal-trigger").leanModal({
      dismissible: false
    });
  }

  selectTemplate(key, event) {
    this.setState((state) => ({
      activeTemplate: key,
      activeTemplateContent: state.templates[key].content
    }));
  }

  @autobind
  pickTemplate() {
    this.props.setTemplateContent();
    this.closeModal();
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    return (
      <div className="row" style={{display: isDisplay}}>
        <div className="col s12 m6 l4">
          <div className="card template-preview">
            <div className="card-title">Blank Template</div>
            <div className="card-content">
              &nbsp;
            </div>
            <div className="card-action">
              <i className="mdi mdi-eye-off"></i> Preview
            </div>
          </div>
        </div>
        {
          this.state.templates.map($.proxy(function (template, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className="card template-preview"
                  onClick={this.selectTemplate.bind(this, key)}>
                  <div className="card-title">{template.name}</div>
                  <div className="card-content">
                    <div dangerouslySetInnerHTML={{__html: template.content}} />
                  </div>
                  <div className="card-action modal-trigger" href="#previewTemplate">
                    <i className="mdi mdi-eye"></i> Preview
                  </div>
                </div>
              </div>
            );
          }, this))
        }
        {/* Email template preview modal popup starts here*/}
        { this.state.templates.length ?
          <div id="previewTemplate" className="modal modal-fixed-header modal-fixed-footer">
            <i className="mdi mdi-close" onClick={this.closeModal}></i>
            <div className="modal-header">
              <div className="head">Add Subbscriber</div>
            </div>
            <div className="modal-content">
              <div className="template-content gray-bg p-10">
                <div dangerouslySetInnerHTML={{__html: this.state.activeTemplateContent}} />
              </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" className="btn red modal-action modal-close p-1-btn" value="Cancel" />
              <input type="button" className="btn blue modal-action" value="Pick This Template"
                onClick={this.pickTemplate} />
            </div>
          </div>
        : null }
      </div>
    );
  }
}
export default SelectPreBuildTemplate;
