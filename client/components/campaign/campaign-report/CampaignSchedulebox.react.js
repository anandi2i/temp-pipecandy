import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import ScheduleEmailView from "./ScheduleEmailView.react";
import Spinner from "../../Spinner.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";

/**
 * Display scheduled mails of a campaign
 */
class CampaignSchedulebox extends React.Component {
  constructor(props) {
    super(props);
    /**
     * Initial state values
     * @property {object} scheduledMails
     * @property {boolean} requestSent
     * @property {boolean} isEmailPreview
     */
    this.state = {
      requestSent: false,
      isEmailPreview: false,
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
    const {scheduledMails, requestSent} = this.state;
    const docEl = document.documentElement;
    const docBody = document.body;
    const scrollTop = (docEl && docEl.scrollTop) || docBody.scrollTop;
    const scrollHeight = (docEl && docEl.scrollHeight) || docBody.scrollHeight;
    const clientHeight = docEl.clientHeight || window.innerHeight;
    const scrolledToBtm = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
    const next = 1;
    const nextStartRange = scheduledMails.data.length + next;
    const limit = 10;
    if(scrolledToBtm) {
      if (requestSent) {
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
   * get scheduled email content and open modal popup
   * @param  {number} keyId - scheduledMails.data index
   */
  emailPreview(keyId) {
    this.setState({
      emailContent: this.state.scheduledMails.data[keyId],
      isEmailPreview: true
    }, () => {
      this.refs.emailPreview.openModal();
    });
  }

  /**
   * Remove schedule email view container after close modal popup
   */
  closeCallback = () => {
    this.setState({
      isEmailPreview: false
    });
  }

  /**
   * render
   * @see http://stackoverflow.com/questions/28320438/react-js-create-loop-through-array
   * @return {ReactElement} markup
   */
  render() {
    const {
      scheduledMails,
      requestSent,
      emailContent,
      isEmailPreview
    } = this.state;
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
                  placeholder="SEARCH SCHEDULED"
                  className="col s12 m8"
                  onChange={this.handleChange} />
              </div>
            </div>
          </div>
          <div className="container">
            {
              scheduledMails.data.map((scheduled, key) => {
                const subject = $(`<div>${scheduled.subject}</div>`).text();
                const content = $(`<div>${scheduled.content}</div>`).text();
                const scheduledAt = moment(scheduled.scheduledAt)
                  .format("DD MMM YYYY");
                return (
                  <div key={key} className="camp-repo-grid waves-effect">
                    <div className="row">
                      <div className="content">
                        <input type="checkbox" className="filled-in"
                          id={key} defaultChecked="" />
                        <label htmlFor={key} className="full-w" />
                        <div className="mail-sub-content" onClick={() => this.emailPreview(key)}>
                          <div className="data-info col s8 m3 l2 person-name">
                            <span>{scheduled.person.firstName}</span>
                          </div>
                          <div className="data-info col s4 m6 l7 hide-on-600">
                            <div className="mailDescription">
                              <div className="subjectLine">{subject}</div>
                              <div className="mailContentLine">{content}</div>
                            </div>
                          </div>
                          <div className="data-info col s4 m3 l3 rit-txt date">
                            {scheduledAt}
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
            style={{display: scheduledMails.data.length ? "none" : "block"}} >
            Scheduled mails seems to be empty!
          </div>
        </div>
        {
          isEmailPreview
          ?
            <ScheduleEmailView ref="emailPreview"
              emailContent={emailContent}
              closeCallback={this.closeCallback}/>
          : ""
        }
        <CampaignFooter campaignId={campaignId} activePage={"scheduled"}/>
      </div>
    );
  }
}

export default CampaignSchedulebox;
