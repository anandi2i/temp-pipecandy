import React from "react";
import {Route, IndexRoute} from "react-router";
import AppContainer from "./components/AppContainer.react";
import IndexPage from "./components/IndexPage.react";
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

function requireAuth(nextState, replaceState) {
  const cookie = document.cookie;
  const userId =
    cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  const accessToken =
    cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");

  if (!Boolean(userId) && !Boolean(accessToken.length))
    replaceState({nextPathname: nextState.location.pathname}, "/login");
}

const routes = (
<Route>
  <Route path="/" component={AppContainer}>
    <IndexRoute component={IndexPage} />
    <Route path="reviewers" component={Reviewer} />
    <Route path="home" component={Home} onEnter={requireAuth}/>
    <Route path="emaillist" component={EmailList} onEnter={requireAuth}/>
    <Route path="response" component={Response} />
    <Route path="email-verified" component={EmailVerification} />
    <Route path="profile" component={Profile} onEnter={requireAuth}/>
  </Route>
  <Route path="login" component={Login} />
  <Route path="signup" component={Signup} />
</Route>
);

module.exports = routes;
