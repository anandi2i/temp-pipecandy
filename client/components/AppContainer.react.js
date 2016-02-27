import React from 'react';
import { RouteHandler } from 'react-router';
import Header from "./Header.react";

var AppContainer = React.createClass({
  render: function () {
    return (
      <div>
        <Header />
        <RouteHandler {...this.props.bootstrap} {...this.props.auth} />
      </div>
    );
  }
});

module.exports = AppContainer;
