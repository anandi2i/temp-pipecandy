import React from "react";
import ReactDOM from "react-dom";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import Spinner from "../../Spinner.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";

/**
 * Display scheduled mails of a campaign
 * @author Dinesh R <dinesh.r@ideas2it.com>
 */
class CampaignSchedulebox extends React.Component {
  constructor(props) {
    super(props);
    /**
     * Initial state values
     * @property {requestSent} listName The name of the list
     * @property {scheduledMails}
     */
    this.state = {
      requestSent: false,
      scheduledMails : {
        data: []
      }
    };
  }

  /**
   * Instantiate material_select
   * Add listener to listen schedule mails Update
   * Add listener to listen if mouse is scrolled to bottom
   * Call initial set of scheduled mails
   */
  componentDidMount() {
    const start = 0;
    const limit = 10;
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
    CampaignStore.addMailboxChangeListener(this.onStoreChange);
    window.addEventListener("scroll", this.handleOnScroll);
    CampaignActions.getScheduledMails({
      id: this.props.params.id,
      start: start,
      end: limit
    });
  }

  /**
   * Destory material select
   * Remove the added listeners for scheduled mails and scroll
   */
  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeMailboxChangeListener(this.onStoreChange);
    window.removeEventListener("scroll", this.handleOnScroll);
  }

  /**
   * Update the scheduled mails data on an emit from store
   */
  onStoreChange = () => {
    const scheduledMails = CampaignStore.getScheduledMails();
    this.setState({
      scheduledMails: {
        data: this.state.scheduledMails.data.concat(scheduledMails)
      },
      requestSent: false
    });
    displayError(CampaignStore.getError());
  }

  /**
   * EventListener for scroll
   * Call to load the next range of scheduled emails if scroll bar is hitting
   * bottom of the page
   */
  handleOnScroll = () => {
    const docEl = document.documentElement;
    const docBody = document.body;
    const scrollTop = (docEl && docEl.scrollTop) || docBody.scrollTop;
    const scrollHeight = (docEl && docEl.scrollHeight) || docBody.scrollHeight;
    const clientHeight = docEl.clientHeight || window.innerHeight;
    const scrolledToBtm = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
    const next = 1;
    const nextStartRange = this.state.scheduledMails.data.length + next;
    const limit = 10;
    if(scrolledToBtm) {
      if (this.state.requestSent) {
        return;
      }
      CampaignActions.getScheduledMails({
        id: this.props.params.id,
        start: nextStartRange,
        end: limit
      });
      this.setState({requestSent: true});
    }
  }

  /**
   * server side search API
   */
  handleChange() {
    //TODO server side search API
  }

  /**
   * render
   * @see http://stackoverflow.com/questions/28320438/react-js-create-loop-through-array
   * @return {ReactElement} markup
   */
  render() {
    const {scheduledMails, requestSent} = this.state;
    const campaignId = this.props.params.id;
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
            </div>
          </div>
          <div className="container">
            {
              scheduledMails.data.map((inbox, key) => {
                const subject = $(inbox.subject).text();
                const content = $(inbox.content).text();
                const scheduledAt = new Date(inbox.scheduledAt).toString();
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
                          <div className="data-info col s8 m3 l2 personName">
                            <b>
                              <span>{inbox.person.firstName}</span>
                            </b>
                          </div>
                          <div className="data-info col s4 m6 l7 hide-on-600">
                            <div className="mailDescription">
                              <span className="subjectLine">{subject}</span>
                              <span className="mailContentLine">{content}</span>
                            </div>
                          </div>
                          <div className="data-info col s4 m3 l3 rit-txt">
                            {scheduledAt}
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
        </div>
        <CampaignFooter campaignId={campaignId} activePage={"scheduled"}/>
      </div>
    );
  }
}

export default CampaignSchedulebox;
