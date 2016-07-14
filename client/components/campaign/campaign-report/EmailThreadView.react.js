import React from "react";
import ReactDOM from "react-dom";
import CampaignReportStore from "../../../stores/CampaignReportStore";

class EmailThreadView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      emailContent: []
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignReportStore.addThreadViewChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignReportStore.removeThreadViewChangeListener(this.onStoreChange);
  }

  openModal = () => {
    this.el.openModal({
      dismissible: false
    });
    this.el.find(".preview-modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
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
        <i className="mdi mdi-close modal-close"></i>
        <div className="modal-header">
          <div className="head">
            HEAD
          </div>
        </div>
        <div className="preview-modal-content">
          <div className="col s12">
            <div className="modal-content">
              {
                emailContent.map(function(val, key){
                  return (
                    <div key={key}>{val.subject}</div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EmailThreadView;
