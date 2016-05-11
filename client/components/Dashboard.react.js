import React from "react";
import {Link} from "react-router";
import TagNameMenu from "./TagNameMenu.react";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    // TODO remove static data
    this.state={
      count: [{
        "title": "opened",
        "percentage": "67",
        "count": "1312",
        "class": "green",
        "status": "7"
        },
        {
        "title": "unopened",
        "percentage": "33",
        "count": "370",
        "class": "blue",
        "status": "7"
        },
        {
        "title": "clicked",
        "percentage": "12",
        "count": "370",
        "class": "green",
        "status": "3"
        },
        {
        "title": "actionable responses",
        "percentage": "06",
        "count": "100",
        "class": "",
        "status": ""
        },
        {
        "title": "bounsed",
        "percentage": "09",
        "count": "370",
        "class": "red",
        "status": "7"
        },
        {
        "title": "unsubscribed",
        "percentage": "09",
        "count": "370",
        "class": "red",
        "status": "7"
        },
        {
        "title": "spam",
        "percentage": "09",
        "count": "370",
        "class": "red",
        "status": "7"
      }],
      tab: [
        {
          name: "Performance compared with",
          class: "menu"
        },
        {
          name: "Previous run",
          class: "menu"
        },
        {
          name: "Industry average",
          class: "menu"
        }
      ],
      tab1: [
        {
          name: "Show status for",
          class: "menu"
        },
        {
          name: "Today",
          class: "menu"
        },
        {
          name: "Last Week",
          class: "menu"
        },
        {
          name: "Last Month",
          class: "menu"
        },
        {
          name: "Last 3 Month",
          class: "menu hide-on-700"
        },
        {
          name: "Specify Timeline",
          class: "menu hide-on-700"
        }
      ],
      activeTab: 1,
      index: 1,
      index1: 2
    };
  }

  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-nav dashboard-head">
            <div className="head">Most recent campaign</div>
            <div className="caps-head">Conference follow-up for west coast participants</div>
            <div className="head">
              <ul className="separator">
                <li>1908 recipients<i className="mdi mdi-record"></i></li>
                <li>12 Dec 2015 1:10AM<i className="mdi mdi-record"></i></li>
                <li><a>View Details Report</a></li>
              </ul>
            </div>
            <div className="sub-head">
              <Link to="/list">Previous Campaign Reports</Link>
            </div>
          </div>
          {/* Top tag Menu */}
          <div className="row tag-name-menu">
            <TagNameMenu handleClick={this.handleClick}
              active={this.state.activeTab}
              tab={this.state.tab} />
          </div>
          <div className="row camp-chip-container" style={{display: this.state.activeTab === this.state.index ? "block" : "none"}}>
            {
              this.state.count.map(function(list, key) {
                return (
                  <div className="col s12 m3 s3" key={key}>
                    <div className="camp-chip">
                      <div className="head">
                        {list.title}
                      </div>
                      <div className="count">
                        <div>{list.percentage}</div>
                        <span>{list.count}</span>
                      </div>
                      {
                        list.status
                          ? <div className="status">
                              <div className="icon"><i className="mdi mdi-menu-up"></i></div>
                              <div className="count">{list.status}</div>
                            </div>
                          : ""
                      }
                    </div>
                  </div>
                );
              })
            }
          </div>
          <div className="row camp-chip-container" style={{display: this.state.activeTab === this.state.index1 ? "block" : "none"}}>
            {/* TODO Add UI */}
            <h2>Sample Content </h2>
          </div>
        </div>
        <div className="container">
          <div className="row main-head">
            Othar status
          </div>
          <div className="row tag-name-menu">
            <TagNameMenu handleClick={this.handleClick}
              active={this.state.activeTab}
              tab={this.state.tab1} />
          </div>
          <h1>Test</h1>
        </div>
      </div>
    );
  }
}

export default Dashboard;
