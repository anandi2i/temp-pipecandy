import React from "react";
import {Route, IndexRoute} from "react-router";
import AppContainer from "./components/AppContainer.react";
import Index from "./components/Index.react";
import Login from "./components/Login.react";
import Signup from "./components/Signup.react";
import Home from "./components/Home.react";
import Reviewer from "./components/Reviewer.react";
import EmailList from "./components/EmailList.react";
import Response from "./components/Response.react";
import EmailVerification from "./components/EmailVerification.react";
import Profile from "./components/user/UserProfile.react";
import UserAction from "./actions/UserAction";

if(document.cookie) {
  UserAction.getUserDetail();
}

const routes = (
  <Route path="/" component={AppContainer}>
    <Route path="reviewers" component={Reviewer} />
    <Route path="home" component={Home} />
    <Route path="login" component={Login} />
    <Route path="signup" component={Signup} />
    <Route path="emaillist" component={EmailList} />
    <Route path="response" component={Response} />
    <Route path="email-verified" component={EmailVerification} />
    <Route path="profile" component={Profile} />
    <IndexRoute component={Index} />
  </Route>
);

module.exports = routes;
