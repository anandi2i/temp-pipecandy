import React from "react";
import ReactDOM from "react-dom";

class AlertModal extends React.Component {
  constructor(props) {
    /**
     * Initial state values
     */
    super(props);
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  /**
   * Open modal popup
   */
  openModal = () => {
    this.el.openModal({
      dismissible: false
    });
  }

  /**
   * Close modal popup and call props errorCb function
   */
  closeModal = () => {
    this.el.closeModal();
    this.props.errorCb();
  }

  /**
   * Close modal popup and call props successCb function
   */
  successModal = () => {
    this.el.closeModal();
    this.props.successCb();
  }

  render() {
    const {message, successBtn, cancelBtn} = this.props;
    return (
      <div id="confirmModal" className="modal min-modal">
        <div className="modal-content p-0">
          <div className="alert">
            <div className="m-b-20">{message}</div>
            <a onClick={() => this.successModal()}
              className="btn btn-dflt blue sm-icon-btn p-1-btn">
              {successBtn}
            </a>
            <a onClick={() => this.closeModal()}
              className="btn btn-dflt red sm-icon-btn">
              {cancelBtn}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default AlertModal;
