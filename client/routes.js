import React from "react";
import {Route, DefaultRoute} from "react-router";
import AppContainer from "./components/AppContainer.react";
import Index from "./components/Index.react";
import Login from "./components/Login.react";
import Signup from "./components/Signup.react";
import Home from "./components/Home.react";
import Reviewer from "./components/Reviewer.react";
import EmailList from "./components/EmailList.react";
import Response from "./components/Response.react";
import EmailVerification from "./components/EmailVerification.react";
import UserAction from "./actions/UserAction";

if(document.cookie) {
  UserAction.getUserDetail();
}

const routes = (
  <Route handler={AppContainer}>
    <Route path="reviewers" handler={Reviewer} />
    <Route path="home" handler={Home} />
    <Route path="login" handler={Login} />
    <Route path="signup" handler={Signup} />
    <Route path="emaillist" handler={EmailList} />
    <Route path="response" handler={Response} />
    <Route path="email-verified" handler={EmailVerification} />
    <DefaultRoute handler={Index} />
  </Route>
);

module.exports = routes;
