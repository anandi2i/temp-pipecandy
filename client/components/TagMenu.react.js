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
    let li = _tabs.map((item, i) => {
      return (
        <li key={i}>
          <a onClick={() => this.handleClick(i.toString())}
            className={this.props.activeTab === i.toString() ? "active" : {}}>
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
