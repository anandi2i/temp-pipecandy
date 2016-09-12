import React from "react";
import ReactDOM from "react-dom";
import {browserHistory} from "react-router";
import EmailListActions from "../../../actions/EmailListActions";
import EmailListStore from "../../../stores/EmailListStore";
import Spinner from "../../Spinner.react";

class PreviewCampaignTemplates extends React.Component {
  constructor(props) {
    super(props);
    this.state = ({
      previewTemplate: {},
      spinner: true
    });
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    EmailListStore.addCampaignGridPreviewListener(this.onStoreChange);
  }

  componentWillUnmount() {
    EmailListStore.removeCampaignGridPreviewListener(this.onStoreChange);
  }

  /**
   * Open the modal popup from campaign grid
   * Init the custome scroll and call API to get campaign template
   */
  openModal = () => {
    EmailListActions.getCampaignPreviewTemplate(this.props.id);
    this.el.openModal({
      dismissible: false
    });
    this.el.find(".preview-modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * Close modal popup and empty the store values
   * Call calback function
   */
  closeModal = () => {
    EmailListStore.removeCampaignTemplatePreview();
    this.el.closeModal();
    this.props.closeCallback();
  }

  /**
   * Get campaign template and set state variables
   */
  onStoreChange = () => {
    const previewTemplate = EmailListStore.getCampaignTemplatePreview();
    this.setState({
      previewTemplate: previewTemplate,
      spinner: false
    });
  }

  render() {
    const {previewTemplate, spinner} = this.state;
    const templateLength =
      previewTemplate.templates && previewTemplate.templates.length;
    const modalHeight = templateLength ? "80%" : "300px";
    return (
      <div className="modal modal-fixed-header lg-modal campaign-preview-tem" style={{height:modalHeight}}>
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            {
              previewTemplate && previewTemplate.campaign
                ? previewTemplate.campaign.name
                : "Email Preview"
            }
          </div>
        </div>
        <div className="preview-modal-content">
          <div className="modal-content" style={{display: spinner ? "none": "block"}}>
            {
              templateLength
                ? previewTemplate.templates.map((val, key) => {
                    return (
                      <div className="template-content preview-mail-container" key={key}>
                        { key
                          ? <div className="col s12 head">
                              Follow up {key}
                            </div>
                          : <div>
                              <div className="col s12 head">Subject</div>
                              <div dangerouslySetInnerHTML={{__html: val.subject}}
                                className="col s12 content"/>
                            </div>
                        }
                        <div dangerouslySetInnerHTML={{__html: val.content}}
                          className="col s12 mail-content content" />
                      </div>
                    );
                  })
                : <CampaignInfoMsg
                    closeModal={this.closeModal}
                    changModalHeight={this.changModalHeight}
                    id={this.props.id}/>
            }
          </div>
          <div style={{display: spinner ? "block": "none"}}
            className="spinner-container">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }
}
export default PreviewCampaignTemplates;

/**
 * unassigned campaign info page
 */
class CampaignInfoMsg extends React.Component {
  /**
   * Close modal popup and empty the store values
   * Call calback function
   */
  closeModal = () => {
    this.props.closeModal();
    browserHistory.push(`/campaign/${this.props.id}/run`);
  }

  render() {
    return (
      <div className="empty-campaign preview-popup">
        <img src="/images/meditation.png" />
        <div className="quotes">
          "The more you know, the less you need"
        </div>
        <div>- Yvon Chouinard</div>
        <div className="content">
          <span>
            There are no campaigns yet.
            <a onClick={() => this.closeModal()}> Want to Run?</a>
          </span>
        </div>
      </div>
    );
  }
}
