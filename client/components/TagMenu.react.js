import React from "react";

/**
 * Display tabs in front of tag name
 */
class TabsMenu extends React.Component {

  /**
   * Call handleClick props function to set active-tab
   * @param {string} index active-tab
   */
  handleClick(index) {
   this.props.handleClick(index);
  }

  render() {
    const _tabs = this.props.tabNames;
    let li = _tabs.map((item, key) => {
      key = key.toString();
      return (
        <li key={key}>
          <a onClick={() => this.handleClick(key)}
            className={this.props.activeTab === key ? "active" : ""}>
            {item.name}
          </a>
        </li>
      );
    });

    return (
      <div className={this.props.mainClass}>
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
