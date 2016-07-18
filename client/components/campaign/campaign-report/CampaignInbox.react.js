import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import _ from "underscore";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import Spinner from "../../Spinner.react";
import TagMenu from "../../TagMenu.react";
import EmailThreadView from "./EmailThreadView.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";

/**
 * Display selected campaign inbox report
 */
class CampaignInbox extends React.Component {
  constructor(props) {
    super(props);
    /**
     * Initial state values
     * @property {object} inboxMails
     * @property {boolean} requestSent
     * @property {boolean} isEmailThreadView
     * @property {string} threadId
     * @property {array} selectedInboxIds
     * @property {string} activeTabId
     * @property {array} tabs
     */
    this.state = {
      inboxMails : [],
      requestSent: false,
      isEmailThreadView: false,
      threadId: "",
      selectedInboxIds: [],
      activeTabId: "all",
      tabs: [{
        id: "all",
        name: "ALL",
      },
      {
        id: "actionable",
        name: "ACTIONABLE",
      },
      {
        id: "out-of-office",
        name: "OUT OF OFFICE",
      },
      {
        id: "nurture",
        name: "NURTURE",
      },
      {
        id: "negative",
        name: "NEGATIVE",
      },
      {
        id: "bounced",
        name: "BOUNCED",
      }]
    };
  }

  /**
   * Instantiate material_select
   * Add listener to listen Inbox mails Update
   * Add listener to listen if mouse is scrolled to bottom
   * Add listener to listen moved mails in inbox
   * Call initial set of inbox mails
   */
  componentDidMount() {
    const start = 0;
    const limit = 10;
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
    CampaignStore.addMailboxChangeListener(this.onStoreChange);
    CampaignStore.addMoveMailsChangeListener(this.moveMailsChange);
    window.addEventListener("scroll", this.handleOnScroll);
    CampaignActions.getInboxMails({
      id: this.props.params.id,
      start: start,
      limit: limit,
      classification: this.state.activeTabId
    });
  }

  /**
   * Destory material select
   * Remove the added listeners for Inbox mails, moved mails and scroll
   */
  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeMailboxChangeListener(this.onStoreChange);
    CampaignStore.removeMoveMailsChangeListener(this.moveMailsChange);
    window.removeEventListener("scroll", this.handleOnScroll);
  }

  /**
   * Update the inbox data from store on change
   */
  onStoreChange = () => {
    const inboxMails = CampaignStore.getInboxMails();
    this.setState({
      inboxMails: this.state.inboxMails.concat(inboxMails),
      requestSent: false
    });
    displayError(CampaignStore.getError());
  }

  /**
   * Remove the selected mails after moving
   * Uncheck all checkboxes
   */
  moveMailsChange = () => {
    const {activeTabId, inboxMails, selectedInboxIds} = this.state;
    this.el.find(".filled-in").attr("checked", false);
    if(activeTabId !== "all") {
      this.setState({
        inboxMails: _.reject(inboxMails,
          inbox => selectedInboxIds.includes(inbox.id)
        ),
        selectedInboxIds: []
      });
    }
  }

  /**
   * EventListener for scroll
   * Call to load the next range of Inbox emails if scroll bar is hitting
   * bottom of the page
   */
  handleOnScroll = () => {
    const {inboxMails, requestSent, activeTabId} = this.state;
    const docEl = document.documentElement;
    const docBody = document.body;
    const scrollTop = (docEl && docEl.scrollTop) || docBody.scrollTop;
    const scrollHeight = (docEl && docEl.scrollHeight) || docBody.scrollHeight;
    const clientHeight = docEl.clientHeight || window.innerHeight;
    const scrolledToBottom = Math.ceil(scrollTop+clientHeight) >= scrollHeight;
    const next = 1;
    const nextStartRange = inboxMails.length + next;
    const limit = 10;
    if (scrolledToBottom) {
      if (requestSent) {
        return;
      }
      CampaignActions.getInboxMails({
        id: this.props.params.id,
        start: nextStartRange,
        limit: limit,
        classification: activeTabId
      });
      this.setState({requestSent: true});
    }
  }

  /**
   * Handle tabs navigations
   * Call to load the Inbox mails
   * @param {string} index
   */
  handleClick = (tabId) => {
    const start = 0;
    const limit = 10;
    this.setState({
      activeTabId: tabId
    });
    CampaignActions.getInboxMails({
      id: this.props.params.id,
      start: start,
      limit: limit,
      classification: tabId
    });
    this.setState({
      inboxMails : [],
      requestSent: true,
      selectedInboxIds: []
    });
  }

  /**
   * server side search API
   */
  handleChange() {
    //TODO server side search API
  }

  /**
   * get email thread and open modal popup
   * @param  {string} threadId - email thread id
   */
  getEmailThread(threadId) {
    if(threadId){
      this.setState({
        threadId: threadId,
        isEmailThreadView: true
      }, () => {
        this.refs.inboxEmailThread.openModal();
      });
    }
  }

  /**
   * Remove email thread view container after close modal popup
   */
  closeCallback = () => {
    this.setState({
      isEmailThreadView: false
    });
  }

  /**
   * Add the checkbox if not exists else remove it
   * Push/Splice the selected inbox id to selectedInboxIds array
   * @param  {number} inboxId selected inbox id
   */
  handleCheckboxChange(inboxId) {
    const {selectedInboxIds} = this.state;
    const idx = selectedInboxIds.indexOf(inboxId);
    const notExist = -1;
    const howMany = 1;
    if(idx === notExist) {
      this.setState({
        selectedInboxIds: selectedInboxIds.concat(inboxId)
      });
    } else {
      this.setState({
        selectedInboxIds: selectedInboxIds.splice(inboxId, howMany)
      });
    }
  }

  /**
   * Move the selected mails to specfic class
   * @param {string} classification - Classification name
   */
  moveMail(classification) {
    const {activeTabId, selectedInboxIds} = this.state;
    CampaignActions.moveMails({
      classification: classification,
      inboxIds: selectedInboxIds,
      activeTabId: activeTabId
    });
  }

  /**
   * render
   * @ref http://stackoverflow.com/questions/28320438/react-js-create-loop-through-array
   * @return {ReactElement} markup
   */
  render() {
    const {
      inboxMails,
      requestSent,
      activeTabId,
      tabs,
      threadId,
      isEmailThreadView
    } = this.state;
    const activeTabName =
      _.findWhere(tabs, {id: activeTabId}).name.toLowerCase();
    const classifications = _.rest(tabs); //remove first object "all"
    return (
      <div>
        <div className="m-b-120">
          {/* Dashboard head */}
          <CampaignReportHead campaignId={this.props.params.id}/>
          <div className="container">
            <div className="row row-container">
              <div className="col s12 m6 l6 filter-container p-lr-0">
                <input
                  type="search"
                  name="search"
                  placeholder="SEARCH INBOX"
                  className="col s12 m8"
                  onChange={this.handleChange} />
              </div>
              <div className="col s12 m6 l6 p-lr-0">
                <div className="right">
                  <a className="btn btn-dflt blue sm-icon-btn dropdown-button"
                    data-activates="addDropDown">
                    Move to
                    <i className="right mdi mdi-chevron-down"></i>
                  </a>
                  <ul id="addDropDown" className="dropdown-content">
                    {
                      classifications.map((tab, key) => {
                        return (
                          <li key={key}>
                            <a onClick={() => this.moveMail(tab.id)}>
                              {tab.name}
                            </a>
                          </li>
                        );
                      })
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <TagMenu activeTabId={activeTabId} tabs={tabs}
            handleClick={this.handleClick} mainClass={"container"} />
          <div>
            <div className="container">
              {
                inboxMails.map((inbox, key) => {
                  const subject = $(`<div>${inbox.subject}</div>`).text();
                  const content = $(`<div>${inbox.content}</div>`).text();
                  const receivedDate = moment(inbox.receivedDate)
                    .format("DD MMM YYYY");
                  return (
                    <div key={key} className="camp-repo-grid waves-effect">
                      <div className="row">
                        <div className="content">
                          <input type="checkbox" className="filled-in"
                            onChange={() => this.handleCheckboxChange(inbox.id)}
                            id={inbox.id} defaultChecked="" />
                          <label htmlFor={inbox.id} className="full-w" />
                          <div className="mail-sub-content" onClick={() => this.getEmailThread(inbox.threadId)}>
                            <div className="data-info col s8 m3 l3 person-name">
                              <span>{inbox.person.firstName}</span>, <span>Me</span>
                              <span> ({inbox.count}) </span>
                            </div>
                            <div className="data-info col s4 m6 l6 hide-on-600">
                              <div className="mailDescription">
                                <div className="subjectLine">{subject}</div>
                                <div className="mailContentLine">{content}</div>
                              </div>
                            </div>
                            <div className="data-info col s4 m3 l3 rit-txt date">
                              {receivedDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }, this)
              }
            </div>
            <div className="container"
              style={{display: requestSent ? "block" : "none"}} >
              <div className="spinner-container">
                <Spinner />
              </div>
            </div>
            <div className="container center-align m-t-20"
              style={{display: inboxMails.length ? "none" : "block"}} >
              {activeTabName} seems to be empty!
            </div>
          </div>
        </div>
        {
          isEmailThreadView
          ?
            <EmailThreadView ref="inboxEmailThread"
              threadId={threadId}
              closeCallback={this.closeCallback}/>
          : ""
        }
        <CampaignFooter campaignId={this.props.params.id} activePage={"inbox"}/>
      </div>
    );
  }
}

export default CampaignInbox;
