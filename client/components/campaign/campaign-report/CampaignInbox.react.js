import React from "react";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import Spinner from "../../Spinner.react";
import TagMenu from "../../TagMenu.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";
import inboxDataObject from "../../../staticData/inboxData";

/**
 * Display selected campaign inbox report
 * TODO Remove static data and replace with dynamic data from mail response
 */
class CampaignInbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      inboxData : [],
      requestSent: false,
      count: 1,
      activeTab: "0",
      tabs: ["0", "1", "2"],
      tabContent: [{
          name: "ALL",
        },
        {
          name: "ACTIONABLE",
        },
        {
          name: "OUT OF OFFICE",
        }]
    };
  }

  componentDidMount() {
    CampaignStore.addChangeListener(this.onStoreChange);
    // Add scrool event listener
    window.addEventListener("scroll", () => this.handleOnScroll());
    // Loade fake data for first time
    this.initFakeData();
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
    // Remove scrool event listener
    window.removeEventListener("scroll", () => this.handleOnScroll());
  }

  /**
   * Enabel select option property
   * TODO need to move in common.js
   */
  componentDidUpdate() {
    $("select").material_select();
  }

  /**
   * Get data from store and append fake data
   * TODO get real data
   */
  onStoreChange = () => {
    this.setState({
      temp: CampaignStore.getAllEmailTemplates()
    }, () =>{
      this.appendData();
    });
    displayError(CampaignStore.getError());
  }

  /**
   * Append fake data
   */
  appendData() {
    let fakeData = this.createFakeData(this.state.inboxData.length,
      this.state.temp.length);
    let newData = this.state.inboxData.concat(fakeData);
    this.setState({inboxData: newData, requestSent: false});
  }

  /**
   * Create fake data
   */
  initFakeData() {
    let newCount = 20;
    let inboxData = this.createFakeData(this.state.inboxData.length, newCount);
    this.setState({inboxData: inboxData});
  }

  /**
   * TODO rename this function
   * @param  {integer} startKey new data start id
   * @param  {integer} counter  new setof data count
   * @return {object}           react dom object
   */
  createFakeData(startKey, counter) {
    const emptyCount = 0;
    let i = 0;
    let data = [];
    for (i = 0; i < counter; i++) {
      let fakeData = (
        <div key={startKey+i} className="camp-repo-grid">
          <div className="row">
            <div className="content">
              <span className="drag-container">
                <i className="mdi mdi-drag-vertical"></i>
              </span>
              <input type="checkbox" className="filled-in"
                id={startKey+i} defaultChecked="" />
              <label htmlFor={startKey+i} className="full-w">
                <div className="data-info col s8 m3 l3 personName">
                  <b>
                    <span>{inboxDataObject[i].person}</span>, <span>{inboxDataObject[i].replyTo}</span>
                    {
                      (inboxDataObject[i].replyCount > emptyCount)
                      ?
                      <span> ({inboxDataObject[i].replyCount}) </span> : ""
                    }

                  </b>
                </div>
                <div className="data-info col s4 m6 l6 hide-on-600">
                  <div className="mailDescription">
                    <span className="subjectLine">{inboxDataObject[i].subject}</span>
                    <span className="mailContentLine">{inboxDataObject[i].content}</span>
                  </div>
                </div>
                <div className="data-info col s4 m3 l3 rit-txt">
                  {inboxDataObject[i].replyDate}
                </div>
              </label>
            </div>
          </div>
        </div>
      );
      data.push(fakeData);
    }
    return data;
  }

  /**
   * EventListener for scroll,
   * It call an API when scroll bar hitting bottom of the page.
   */
  handleOnScroll(){
    let docEl = document.documentElement;
    let docBody = document.body;
    let scrollTop = (docEl && docEl.scrollTop) || docBody.scrollTop;
    let scrollHeight = (docEl && docEl.scrollHeight) || docBody.scrollHeight;
    let clientHeight = docEl.clientHeight || window.innerHeight;
    let scrolledToBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

    if (scrolledToBottom) {
      if (this.state.requestSent) {
        return;
      }
      // enumerate a slow query
      let timeDelay = 2000;
      setTimeout(CampaignActions.getAllInboxReport(), timeDelay);
      this.setState({requestSent: true});
    }
  }

  /**
   * Handle tabs navigations
   * @param  {string} index set activeTab
   */
  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  /**
   * server side search API
   */
  handleChange(){
    //TODO server side search API
  }

  render(){
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
          <TagMenu activeTab={this.state.activeTab}
            handleClick={this.handleClick} tabNames={this.state.tabContent}
            mainClass={"container"} />
          <div style={{display: this.state.activeTab === this.state.tabs[0] ? "block" : "none"}}>
            <div className="container">
              {this.state.inboxData}
            </div>
            {
              this.state.requestSent ?
              <div className="container">
                <div className="infinity-spinner">
                  <Spinner />
                </div>
              </div>
              : ""
            }
          </div>
          <div style={{display: this.state.activeTab === this.state.tabs[1] ? "block" : "none"}}>
            <div className="container">
              <div className="container">
                <div className="infinity-spinner">
                  <Spinner />
                </div>
              </div>
            </div>
          </div>
        </div>
        <CampaignFooter campaignId={this.props.params.id} activePage={"inbox"}/>
      </div>
    );
  }
}

export default CampaignInbox;
