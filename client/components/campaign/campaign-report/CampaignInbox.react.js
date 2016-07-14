import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import _ from "underscore";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import Spinner from "../../Spinner.react";
import TagMenu from "../../TagMenu.react";
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
     * @property {string} activeTabId
     * @property {array} tabs
     */
    this.state = {
      inboxMails : [],
      requestSent: false,
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
   * Call initial set of inbox mails
   */
  componentDidMount() {
    const start = 0;
    const limit = 10;
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
    CampaignStore.addMailboxChangeListener(this.onStoreChange);
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
   * Remove the added listeners for Inbox mails and scroll
   */
  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeMailboxChangeListener(this.onStoreChange);
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
      requestSent: true
    });
  }

  /**
   * server side search API
   */
  handleChange() {
    //TODO server side search API
  }

  /**
   * render
   * @ref http://stackoverflow.com/questions/28320438/react-js-create-loop-through-array
   * @return {ReactElement} markup
   */
  render() {
    const {inboxMails, requestSent, activeTabId, tabs} = this.state;
    const activeTabName =
      _.findWhere(tabs, {id: activeTabId}).name.toLowerCase();
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
                <div className="col s12 m8 offset-m4 p-lr-0">
                  <select>
                    <option value="" disabled>Choose your list</option>
                    <option value="1">Show for all lists</option>
                    <option value="1">List 1</option>
                    <option value="2">List 2</option>
                    <option value="3">List 3</option>
                  </select>
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
                            id={key} defaultChecked="" />
                          <label htmlFor={key} className="full-w" />
                          <div className="mail-sub-content">
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
        <CampaignFooter campaignId={this.props.params.id} activePage={"inbox"}/>
      </div>
    );
  }
}

export default CampaignInbox;
