import React from "react";
import TagNameMenu from "../../TagNameMenu.react";

/**
 * Other Performance status dashboard component
 */
class OtherPerformanceStatus extends React.Component {
  constructor(props) {
    super(props);
    // TODO remove static data
    this.state={
      tab: [
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
      activeTab: "1",
      tabs: ["1", "2", "3", "4", "5"],
      otherStatusCount: [
        {
          "title": "emails sent",
          "percentage": "1507",
          "class": ""
        },
        {
          "title": "actionable responses",
          "percentage": "34",
          "class": "text-blue"
        },
        {
          "title": "avg. actionable responses per day",
          "percentage": "6.8",
          "class": ""
        },
        {
          "title": "email ids found",
          "percentage": "132456",
          "class": "text-blue"
        }
      ]
    };
  }

/**
 * handle tab navigations
 * @param {string} index active-tab
 */
  handleClick = (index) => {
    this.setState({
      activeTab: index
    });
  }

  render() {
    const activeTab = this.state.activeTab;
    const tab = this.state.tab;
    const tabs = this.state.tabs;
    return (
      <div className="container">
        <div className="row main-head">
          Other status
        </div>
        <div className="row tag-name-menu">
          <TagNameMenu handleClick={this.handleClick}
            active={activeTab}
            tab={tab} />
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[0] ? "block" : "none"}}>
          {
            this.state.otherStatusCount.map((list, key) => {
              return (
                <div className="col s12 m3 s3" key={key}>
                  <div className="other-status">
                    <div className="container">
                      <div className="head">
                        {list.title}
                      </div>
                      <div className="value">
                        <div className={list.class}>{list.percentage}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[1] ? "block" : "none"}}>
          {/* TODO Add UI */}
          <h2>Sample Content Tab2</h2>
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[2] ? "block" : "none"}}>
          {/* TODO Add UI */}
          <h2>Sample Content Tab3</h2>
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[3] ? "block" : "none"}}>
          {/* TODO Add UI */}
          <h2>Sample Content Tab4</h2>
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[4] ? "block" : "none"}}>
          {/* TODO Add UI */}
          <h2>Sample Content Tab5</h2>
        </div>
      </div>
    );
  }
}

export default OtherPerformanceStatus;
