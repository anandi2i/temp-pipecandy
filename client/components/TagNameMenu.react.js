import React from "react";

class TagNameMenu extends React.Component {

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
          <li key={i} onClick={() => this.handleClick(i)} className={this.props.active === i ? `active ${item.class}` : `${item.class}`}>
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
