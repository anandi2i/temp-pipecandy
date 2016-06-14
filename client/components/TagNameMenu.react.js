import React from "react";

/**
 * Display tabs in front of tag name
 */
class TagNameMenu extends React.Component {

/**
 * Call handleClick props function to set active-tab
 * @param {string} index active-tab
 */
  handleClick(index) {
    this.props.handleClick(index);
  }

  render() {
    const _tabs = this.props.tab;
    const initCount = 0;
    let li = _tabs.map((item, i) => {
      return (
        i === initCount
        ?
          <li key={i}>{item.name}</li>
        :
          <li key={i} onClick={() => this.handleClick(i.toString())} className={this.props.active === i.toString() ? `active ${item.class}` : `${item.class}`}>
            {item.name}
          </li>
      );
    });

    return (
      <ul>
        {li}
      </ul>
    );
  }
}

export default TagNameMenu;
