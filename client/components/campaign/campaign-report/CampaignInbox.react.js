import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";
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
     * @property {string} activeTab
     * @property {array} tabs
     * @property {array} tabContent
     */
    this.state = {
      inboxMails : {
        data: []
      },
      requestSent: false,
      activeTab: "0",
      tabs: ["0", "1", "2"],
      tabContent: [{
        name: "ALL",
      },
      {
        name: "ACTIONABLE",
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
      end: limit,
      actionable: false
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
      inboxMails: {
        data: this.state.inboxMails.data.concat(inboxMails)
      },
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
    const {inboxMails, requestSent, activeTab, tabs} = this.state;
    const docEl = document.documentElement;
    const docBody = document.body;
    const scrollTop = (docEl && docEl.scrollTop) || docBody.scrollTop;
    const scrollHeight = (docEl && docEl.scrollHeight) || docBody.scrollHeight;
    const clientHeight = docEl.clientHeight || window.innerHeight;
    const scrolledToBottom = Math.ceil(scrollTop+clientHeight) >= scrollHeight;
    const next = 1;
    const nextStartRange = inboxMails.data.length + next;
    const limit = 10;
    if (scrolledToBottom) {
      if (requestSent) {
        return;
      }
      let actionable = false;
      if(activeTab === tabs[1]) {
        actionable = true;
      }
      CampaignActions.getInboxMails({
        id: this.props.params.id,
        start: nextStartRange,
        end: limit,
        actionable: actionable
      });
      this.setState({requestSent: true});
    }
  }

  /**
   * Handle tabs navigations
   * Call to load the Inbox mails
   * @param {string} index
   */
  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
    let actionable = false;
    if(index === this.state.tabs[1]) {
      actionable = true;
    }
    CampaignActions.getInboxMails({
      id: this.props.params.id,
      start: 0,
      end: 10,
      actionable: actionable
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
    const {inboxMails, requestSent, activeTab, tabContent} = this.state;
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
          <TagMenu activeTab={activeTab}
            handleClick={this.handleClick} tabNames={tabContent}
            mainClass={"container"} />
          <div>
            <div className="container">
              {
                inboxMails.data.map((inbox, key) => {
                  const subject = $(`<div>${inbox.subject}</div>`).text();
                  const content = $(`<div>${inbox.content}</div>`).text();
                  const receivedDate = moment(inbox.receivedDate)
                    .format("DD MMM YYYY");
                  return (
                    <div key={key} className="camp-repo-grid">
                      <div className="row">
                        <div className="content">
                          <span className="drag-container">
                            <i className="mdi mdi-drag-vertical"></i>
                          </span>
                          <input type="checkbox" className="filled-in"
                            id={key} defaultChecked="" />
                          <label htmlFor={key} className="full-w">
                            <div className="data-info col s8 m3 l3 personName">
                              <b>
                                <span>{inbox.person.firstName}</span>, <span>Me</span>
                                  <span> ({inbox.count}) </span>
                              </b>
                            </div>
                            <div className="data-info col s4 m6 l6 hide-on-600">
                              <div className="mailDescription">
                                <span className="subjectLine">{subject}</span>
                                <span className="mailContentLine">{content}</span>
                              </div>
                            </div>
                            <div className="data-info col s4 m3 l3 rit-txt">
                              {receivedDate}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                }, this)
              }
            </div>
            <div className="container"
              style={{display: requestSent ? "block" : "none"}} >
              <div className="infinity-spinner">
                <Spinner />
              </div>
            </div>
            <div className="container center-align m-t-20"
              style={{display: inboxMails.data.length ? "none" : "block"}} >
              Inbox seems to be empty!
            </div>
          </div>
        </div>
        <CampaignFooter campaignId={this.props.params.id} activePage={"inbox"}/>
      </div>
    );
  }
}

export default CampaignInbox;
