import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";

class ScheduleEmailView extends React.Component {
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

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  /**
   * Open schedule email
   * Init collapsible view
   * Init custom scroolbar
   */
  openModal = () => {
    this.setState({
      emailContent: this.props.emailContent
    }, () => {
      this.el.openModal({
        dismissible: false
      });
      this.el.find(".collapsible").collapsible({
        accordion : false
      });
      this.el.find(".preview-modal-content").mCustomScrollbar({
        theme:"minimal-dark"
      });
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

  render() {
    const emailContent = this.state.emailContent;
    const scheduledAt = moment(emailContent.scheduledAt)
      .format("MMMM Do YYYY, h:mm:ss a");
    return (
      <div className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head">
            {emailContent.subject}
          </div>
        </div>
        <div className="preview-modal-content">
          <div className="col s12">
            <div className="modal-content">
              <ul className="collapsible" data-collapsible="expandable">
                <li className="active">
                  <div className="collapsible-header active">
                    <div>
                      <span className="left">
                        <strong>
                          {
                            emailContent.person
                              ? emailContent.person.firstName
                              : ""
                          }
                        </strong>
                        {emailContent.email}
                      </span>
                      <span className="right">{scheduledAt}</span>
                    </div>
                  </div>
                  <div className="collapsible-body">
                    <div className="subject">{emailContent.subject}</div>
                    <div dangerouslySetInnerHTML={{__html: emailContent.content}} />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ScheduleEmailView;
