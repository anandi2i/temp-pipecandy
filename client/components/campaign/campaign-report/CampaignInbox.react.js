import React from "react";
import ReactDOM from "react-dom";
import update from "react-addons-update";
import moment from "moment";
import _ from "underscore";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import Spinner from "../../Spinner.react";
import TabsMenu from "../../TabsMenu.react";
import EmailThreadView from "./EmailThreadView.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";
import {resultsEmpty} from "../../../utils/UserAlerts";

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
      requestSent: true,
      isEmailThreadView: false,
      threadId: "",
      selectedInboxIds: [],
      activeTabId: "all",
      tabs: [{
        id: "all",
        name: "ALL",
        countId: "all"
      },
      {
        id: "actionable",
        name: "ACTIONABLE",
        countId: "actionable"
      },
      {
        id: "out-of-office",
        name: "OUT OF OFFICE",
        countId: "outOfOffice"
      },
      {
        id: "nurture",
        name: "NURTURE",
        countId: "nurture"
      },
      {
        id: "negative",
        name: "NEGATIVE",
        countId: "negative"
      },
      {
        id: "bounced",
        name: "BOUNCED",
        countId: "bounced"
      }],
      inboxClassificationCount: {}
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
    CampaignStore.addCountChangeListener(this.onCountChange);
    window.addEventListener("scroll", this.handleOnScroll);
    CampaignActions.getInboxMails({
      id: this.props.params.id,
      start: start,
      limit: limit,
      classification: this.state.activeTabId
    });
    CampaignActions.getInboxClassificationCount(this.props.params.id);
  }

  /**
   * Destory material select
   * Remove the added listeners for Inbox mails, moved mails and scroll
   */
  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeMailboxChangeListener(this.onStoreChange);
    CampaignStore.removeMoveMailsChangeListener(this.moveMailsChange);
    CampaignStore.removeCountChangeListener(this.onCountChange);
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
    CampaignActions.getInboxClassificationCount(this.props.params.id);
    displayError(CampaignStore.getError());
  }

  /**
   * Remove the selected mails after moving
   * Uncheck all checkboxes
   */
  moveMailsChange = () => {
    const {activeTabId, inboxMails, selectedInboxIds} = this.state;
    this.el.find(".filled-in").attr("checked", false);
    CampaignActions.getInboxClassificationCount(this.props.params.id);
    if(activeTabId !== "all") {
      this.setState({
        inboxMails: _.reject(inboxMails,
          inbox => _.contains(selectedInboxIds, inbox.id)
        ),
        selectedInboxIds: []
      });
    } else {
      this.setState({selectedInboxIds: []});
    }
  }

  onCountChange = () => {
    this.setState({
      inboxClassificationCount: CampaignStore.getResponseCount()
    });
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
        selectedInboxIds: update(selectedInboxIds, {$splice: [[idx, howMany]]})
      });
    }
  }

  /**
   * Move the selected mails to specfic class
   * @param {string} classification - Classification name
   */
  moveMail(classification) {
    const {activeTabId, selectedInboxIds} = this.state;
    if(activeTabId !== classification) {
      CampaignActions.moveMails({
        classification: classification,
        inboxIds: selectedInboxIds,
        activeTabId: activeTabId
      });
    }
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
      isEmailThreadView,
      inboxClassificationCount
    } = this.state;
    const showEmptymsg = inboxMails.length || requestSent;
    const classifications = _.rest(tabs); //remove first object "all"
    const campaignId = this.props.params.id;
    const enableDropDown = inboxMails.length ? "" : "disabled disable-ptr";
    return (
      <div>
        <div className="m-b-120">
          {/* Dashboard head */}
          <CampaignReportHead campaignId={campaignId}/>
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
                  <a className={`btn btn-dflt blue sm-icon-btn dropdown-button
                    ${enableDropDown}`}
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
                  {
                    inboxMails.length
                    ? <a className="btn btn-dflt blue sm-icon-btn m-l-20"
                      href={`/api/campaigns/${campaignId}/downloadResponse`}>
                        Download Response
                      </a>
                    : null
                  }
                </div>
              </div>
            </div>
          </div>
          <TabsMenu activeTabId={activeTabId} tabs={tabs} mainClass={"container"}
            handleClick={this.handleClick} count={inboxClassificationCount} />
          <div>
            <div className="container">
              {
                inboxMails.map((inbox, key) => {
                  const subject = $(`<div>${inbox.subject}</div>`).text();
                  const content = $(`<div>${inbox.content}</div>`).text();
                  const receivedDate = moment(inbox.receivedDate)
                    .format("MMM Do YY, h:mm a");
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
                              <div className="mail-description">
                                <div className="subject-line">{subject}</div>
                                <div className="mail-content-line">{content}</div>
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
              style={{display: showEmptymsg ? "none" : "block"}} >
              {resultsEmpty.allResponsesForInbox}
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
        <CampaignFooter campaignId={campaignId} activePage={"inbox"}/>
      </div>
    );
  }
}

export default CampaignInbox;
