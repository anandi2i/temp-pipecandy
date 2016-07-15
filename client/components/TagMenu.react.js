import React from "react";

/**
 * Display tabs in front of tag name
 */
class TabsMenu extends React.Component {

  /**
   * Call handleClick props function to set active-tab
   * @param {string} index active-tab
   */
  handleClick(tabId) {
   this.props.handleClick(tabId);
  }

  render() {
    const {tabs, activeTabId, mainClass} = this.props;
    const li = tabs.map((tab, index) => {
      return (
        <li key={index}>
          <a onClick={() => this.handleClick(tab.id)}
            className={activeTabId === tab.id ? "active" : ""}>
            {tab.name}
          </a>
        </li>
      );
    });

    return (
      <div className={mainClass}>
        <div className="row inner-tabs">
          <nav>
            <div className="nav-wrapper">
              <ul className="left main-menu-link">
                {li}
              </ul>
            </div>
          </nav>
        </div>
      </div>
    );
  }
}

export default TabsMenu;
