import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import CampaignReportStore from "../../../stores/CampaignReportStore";
import CampaignActions from "../../../actions/CampaignActions";

class EmailThreadView extends React.Component {
  constructor(props) {
    /**
     * Initial state values
     * @property {array} emailContent
     */
    super(props);
    this.state = {
      emailContent: []
    };
  }

  /**
   * Add listener to listen email thread view
   * Call getEmailThread action to get thread view
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignReportStore.addThreadViewChangeListener(this.onStoreChange);
    CampaignActions.getEmailThread(this.props.threadId);
  }

  /**
   * Destory listen email thread view
   */
  componentWillUnmount() {
    CampaignReportStore.removeThreadViewChangeListener(this.onStoreChange);
  }

  /**
   * Open email thread view popup
   * Init collapsible view
   * Init custom scroolbar
   */
  openModal = () => {
    this.el.openModal({
      dismissible: false
    });
    this.el.find(".collapsible").collapsible({
      accordion : false
    });
    this.el.find(".preview-modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * Close modal popup
   * Call closeCallback to remove this popup in parent container
   */
  closeModal = () => {
    this.el.closeModal();
    this.props.closeCallback();
  }

  /**
   * Update the email thread and emit from store
   */
  onStoreChange = () => {
    const getEmails = CampaignReportStore.getEmailThread();
    this.setState({
      emailContent: getEmails
    });
  }

  render() {
    const emailContent = this.state.emailContent;
    return (
      <div className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            {emailContent.length ? emailContent[0].subject : "Email Preview"}
          </div>
        </div>
        <div className="preview-modal-content">
          <div className="col s12">
            <div className="modal-content">
              <ul className="collapsible" data-collapsible="expandable">
              {
                emailContent.map(function(email, key){
                  const receivedDate = moment(email.receivedDate)
                    .format("DD MMM YYYY");
                  return (
                    <li className="active" key={key}>
                      <div className="collapsible-header">
                        <div>
                          <span className="left">{email.fromEmailId}</span>
                          <span className="right">{receivedDate}</span>
                        </div>
                        <div className="to-email">
                          <small>to {email.toEmailId}</small>
                        </div>
                      </div>
                      <div className="collapsible-body">
                        <div className="subject">{email.subject}</div>
                        <div dangerouslySetInnerHTML={{__html: email.content}} />
                      </div>
                    </li>
                  );
                })
              }
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EmailThreadView;
