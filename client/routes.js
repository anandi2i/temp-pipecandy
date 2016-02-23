var React = require("react");
var ReactRouter = require("react-router");
var DefaultRoute = ReactRouter.DefaultRoute;
var Route = ReactRouter.Route;

var AppContainer = require("./components/AppContainer.react")
var Index = require("./components/Index.react");
var Login = require("./components/Login.react");
var Signup = require("./components/Signup.react");
var Home = require("./components/Home.react");
var Reviewer = require("./components/Reviewer.react");
var EmailList = require("./components/EmailList.react");

var routes = (
  <Route handler={AppContainer}>
    <Route path="reviewers" handler={Reviewer} />
    <Route path="auth/account" handler={Home} />
    <Route path="login" handler={Login}/>
    <Route path="signup" handler={Signup}/>
    <Route path="emaillist" handler={EmailList}/>
    <DefaultRoute handler={Home}/>
  </Route>
);

module.exports = routes;
