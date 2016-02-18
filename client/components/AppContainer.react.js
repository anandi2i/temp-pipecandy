var React = require('react');

var ReactRouter = require('react-router');
var RouteHandler = ReactRouter.RouteHandler;

var AppContainer = React.createClass({
  render: function () {
    return (
    	<div>
	      	<RouteHandler {...this.props.bootstrap} {...this.props.auth} />
      	</div>
    );
  }
});

module.exports = AppContainer;
