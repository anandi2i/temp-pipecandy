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
   * Close modal popup and call props confirmCb function
   */
  handleClick = (isTrue) => {
    this.el.closeModal();
    this.props.confirmCb(isTrue);
  }

  render() {
    const {message, successBtn, cancelBtn} = this.props;
    return (
      <div id="confirmModal" className="modal min-modal">
        <div className="modal-content p-0">
          <div className="alert">
            <div className="m-b-20">{message}</div>
            <a onClick={() => this.handleClick(true)}
              className="btn btn-dflt blue sm-icon-btn p-1-btn">
              {successBtn}
            </a>
            <a onClick={() => this.handleClick(false)}
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
