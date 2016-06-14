import React from "react";
import TagNameMenu from "../../TagNameMenu.react";

/**
 * Display campaign performance component in dashboard
 */
class PerformanceCompare extends React.Component {
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
      tabs: ["1", "2"],
      activeTab: "1"
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
        {/* Top tag Menu */}
        <div className="row tag-name-menu">
          <TagNameMenu handleClick={this.handleClick}
            active={activeTab}
            tab={tab} />
        </div>
        <div className="row camp-chip-container" style={{display: activeTab === tabs[0] ? "block" : "none"}}>
          {
            this.state.count.map((list, key) => {
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
        <div className="row camp-chip-container" style={{display: activeTab === tabs[1] ? "block" : "none"}}>
          {/* TODO Add UI */}
          <h2>Sample Content Tab2</h2>
        </div>
      </div>
    );
  }
}

export default PerformanceCompare;
