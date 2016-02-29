import React from "react";
import {RouteHandler} from "react-router";
import Header from "./Header.react";

var AppContainer = React.createClass({
  render: function () {
    return (
      <div>
        <Header />
        <RouteHandler />
      </div>
    );
  }
});

module.exports = AppContainer;
