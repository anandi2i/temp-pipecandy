import React from "react";
import Header from "./Header.react";

var AppContainer = React.createClass({
  render: function () {
    return (
      <div>
        <Header />
        {this.props.children}
      </div>
    );
  }
});

module.exports = AppContainer;
