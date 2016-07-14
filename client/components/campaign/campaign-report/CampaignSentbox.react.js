import React from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import Spinner from "../../Spinner.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";

/**
 * Display sent mails of a campaign
 * @author Dinesh R <dinesh.r@ideas2it.com>
 */
class CampaignSentbox extends React.Component {
  constructor(props) {
    super(props);
    /**
     * Initial state values
     * @property {object} sentMails
     * @property {boolean} requestSent
     */
    this.state = {
      requestSent: false,
      sentMails : {
        data: []
      }
    };
  }

  /**
   * Instantiate material_select
   * Add listener to listen sent mails Update
   * Add listener to listen if mouse is scrolled to bottom
   * Call initial set of sent mails
   */
  componentDidMount() {
    const start = 0;
    const limit = 10;
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
    CampaignStore.addMailboxChangeListener(this.onStoreChange);
    window.addEventListener("scroll", this.handleOnScroll);
    CampaignActions.getSentMails({
      id: this.props.params.id,
      start: start,
      end: limit
    });
  }

  /**
   * Destory material select
   * Remove the added listeners for sent mails and scroll
   */
  componentWillUnmount() {
    this.el.find("select").material_select("destroy");
    CampaignStore.removeMailboxChangeListener(this.onStoreChange);
    window.removeEventListener("scroll", this.handleOnScroll);
  }

  /**
   * Update the sent mails data on an emit from store
   */
  onStoreChange = () => {
    const sentMails = CampaignStore.getSentMails();
    this.setState({
      sentMails: {
        data: this.state.sentMails.data.concat(sentMails)
      },
      requestSent: false
    });
    displayError(CampaignStore.getError());
  }

  /**
   * EventListener for scroll
   * Call to load the next range of sent emails if scroll bar is hitting
   * bottom of the page
   */
  handleOnScroll = () => {
    const {sentMails, requestSent} = this.state;
    const docEl = document.documentElement;
    const docBody = document.body;
    const scrollTop = (docEl && docEl.scrollTop) || docBody.scrollTop;
    const scrollHeight = (docEl && docEl.scrollHeight) || docBody.scrollHeight;
    const clientHeight = docEl.clientHeight || window.innerHeight;
    const scrolledToBtm = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
    const next = 1;
    const nextStartRange = sentMails.data.length + next;
    const limit = 10;
    if(scrolledToBtm) {
      if (requestSent) {
        return;
      }
      CampaignActions.getSentMails({
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
    const {sentMails, requestSent} = this.state;
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
                  placeholder="SEARCH SENT"
                  className="col s12 m8"
                  onChange={this.handleChange} />
              </div>
            </div>
          </div>
          <div className="container">
            {
              sentMails.data.map((sentMail, key) => {
                const subject = $(`<div>${sentMail.subject}</div>`).text();
                const content = $(`<div>${sentMail.content}</div>`).text();
                const scheduledAt = moment(sentMail.scheduledAt)
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
                          <div className="data-info col s8 m3 l2 personName">
                            <b>
                              <span>{sentMail.person.firstName}</span>
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
            <div className="spinner-container">
              <Spinner />
            </div>
          </div>
          <div className="container center-align m-t-20"
            style={{display: sentMails.data.length ? "none" : "block"}} >
            Sent mails seems to be empty!
          </div>
        </div>
        <CampaignFooter campaignId={campaignId} activePage={"sent"}/>
      </div>
    );
  }
}

export default CampaignSentbox;
