var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('react-router');
var routes = require('./routes');
var bootstrap = window.__BOOTSTRAP__ || {};
var user = window.__USER__ || {};

Router.run(routes,  Router.HistoryLocation, function (Handler) {
  ReactDOM.render(<Handler bootstrap={bootstrap} auth={user}/>, document.getElementById('root'));
});
