import React from "react";
import CampaignFooter from "./CampaignFooter.react";
import CampaignReportHead from "../CampaignReportHead.react";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignStore from "../../../stores/CampaignStore";
import outboxDataObject from "../../../staticData/outboxData";

/**
 * Display selected campaign outbox report
 */
class CampaignOutbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      outboxData : [],
      requestSent: false,
      count: 2,
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
    let fakeData = this.createFakeData(this.state.outboxData.length,
      this.state.temp.length);
    let newData = this.state.outboxData.concat(fakeData);
    this.setState({outboxData: newData, requestSent: false});
  }

  /**
   * Create fake data
   */
  initFakeData() {
    let newCount = 10;
    let outboxData = this.createFakeData(this.state.outboxData.length,
      newCount);
    this.setState({outboxData: outboxData});
  }

  /**
   * TODO rename this function
   * @param  {integer} startKey new data start id
   * @param  {integer} counter  new setof data count
   * @return {object}           react dom object
   */
  createFakeData(startKey, counter) {
    let i = 0;
    const emptyCount = 0;
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
                    <span>{outboxDataObject[i].person}</span>, <span>{outboxDataObject[i].replyTo}</span>
                    {
                      (outboxDataObject[i].replyCount > emptyCount)
                      ?
                      <span> ({outboxDataObject[i].replyCount}) </span> : ""
                    }

                  </b>
                </div>
                <div className="data-info col s4 m6 l6 hide-on-600">
                  <div className="mailDescription">
                    <span className="subjectLine">{outboxDataObject[i].subject}</span>
                    <span className="mailContentLine">{outboxDataObject[i].content}</span>
                  </div>
                </div>
                <div className="data-info col s4 m3 l3 rit-txt">
                  {outboxDataObject[i].replyDate}
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
                  placeholder="SEARCH OUTBOX"
                  className="col s12 m8"
                  onChange={this.handleChange} />
              </div>
              <div className="col s12 m6 l6 p-lr-0">
                <div className="row r-btn-container preview-content m-lr-0">
                  <div className="btn btn-dflt error-btn">
                    DISCARD MAIL(S)
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container">
            {this.state.outboxData}
          </div>
          <CampaignFooter campaignId={this.props.params.id} activePage={"outbox"} />
        </div>
      </div>
    );
  }
}

export default CampaignOutbox;
