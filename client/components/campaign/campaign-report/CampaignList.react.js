import React from "react";
import ReactDOM from "react-dom";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";
import {Link} from "react-router";

class CampaignList extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.state = {
      lists: []
    };
  }

  /**
   * Initialize the lean modal and custom scrollbar when the user template form
   * popup is loaded
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  /**
   * On unmounting the component remove close the modal and navigate to list
   * details page
   */
  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  /**
   * On store change open the modal and load the list for campaign in the view
   */
  onStoreChange = () => {
    let emailLists = CampaignStore.getCampaignEmailList();
    this.setState({
      lists : emailLists
    }, () => {
      this.openModal();
    });
  }

  /**
   * Initialize scrollbar when modal is opened
   */
  openModal = () => {
    this.el.openModal({
      dismissible: false
    });
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * When the view list is clicked, generateCampaignList method will be triggered
   */
  generateCampaignList = () => {
    CampaignActions.getCampaignEmailList(this.props.campaignId);
  };

  /**
   * Close the modal when closeModal is triggered
   */
  closeModal = () => {
    this.el.closeModal();
  }

  /**
   * render
   * @return {ReactElement} - Modal popup for displaying the email list for
   * the current campaign
   */
  render() {
    const {lists} = this.state;
    return (
      <div id="campaign-list" className="modal campaign-list-modal">
        <i className="mdi mdi-close modal-close"></i>
        <div className="modal-header">
          <div className="head">
            {"Campaign List(s)"}
          </div>
        </div>
        <div className="modal-content">
          {
            lists.map((list, key) => {
              return (
                <div className="list-name" key={key}>
                  <Link to={`/list/${list.listId}`}>
                    {list.listName}
                    <span className="recepient-count">({list.recepientCount} recepients)</span>
                  </Link>
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}

export default CampaignList;
