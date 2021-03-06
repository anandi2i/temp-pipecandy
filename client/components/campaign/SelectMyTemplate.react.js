import React from "react";
import ReactDOM from "react-dom";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";
import {SuccessMessages} from "../../utils/UserAlerts";

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

  /**
   * To Initialize SelectMyTemplate DOM
   * @listens {CampaignStore} change event
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  /**
   * Remove the CampaignStore listener while unmounting
   */
  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  /**
   * On store change, update the template list in the view
   */
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

 /**
  * Method to select the user template based on the selected template key
  */
  selectUserTemplate(key) {
    const {templates} = this.state;
    this.setState((state) => ({
      activeTemplate: key,
      activeTemplateContent: templates[key].content
    }), () => {
      this.props.setTemplate(templates[key].content, "",
        templates[key].followUps);
    });
    displaySuccess(SuccessMessages.successSelectTemplate
      .replace("$selectedTemplate", `<strong>
      ${templates[key].name}</strong>`));
  }

  /**
   * Add or Remove active class to the template cards
   */
  isActive(value){
    const isActive = (value === this.state.activeTemplate) ? "active" : "";
    return `card template-preview ${isActive}`;
  }

  render() {
    const {templates, activeTemplate, activeTemplateContent,
      innerTabIndex} = this.state;
    const index = 1;
    const isDisplay = (this.props.active === innerTabIndex ? "block" : "none");
    return (
      <div className="row user-templates" style={{display: isDisplay}}>
        {
          templates.map(function (template, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className={this.isActive(key)}
                  onClick={() => this.selectUserTemplate(key)}>
                  <div className="card-title">{template.name}</div>
                  <div className="card-content">
                    <div dangerouslySetInnerHTML={{__html: template.content}} />
                    {
                      template.followUps ? template.followUps.map(
                        (followUp, key) => {
                          return (
                            <div className="follow-up-container" key={key}>
                              <div className="follow-up-title" >
                                Follow Up {key + index}:
                              </div>
                              <div className="follow-up-content m-b-20"
                              dangerouslySetInnerHTML={{__html: followUp.content
                              }} />
                            </div>
                          );
                      }) : null
                    }
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
                {
                  templates[activeTemplate].followUps ?
                    templates[activeTemplate].followUps.map(
                    (followUp, key) => {
                      return (
                        <div className="follow-up-container" key={key}>
                          <div className="follow-up-title">
                            Follow Up {key + index}:
                          </div>
                          <div className="follow-up-content m-b-20"
                            dangerouslySetInnerHTML={{__html: followUp.content}}
                          />
                        </div>
                      );
                  }) : null
                }
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
export default SelectMyTemplate;
