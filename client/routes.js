import React from "react";
import {Route, IndexRoute} from "react-router";
import AppContainer from "./components/AppContainer.react";
import IndexPage from "./components/IndexPage.react";
import Login from "./components/Login.react";
import Signup from "./components/Signup.react";
import Home from "./components/Home.react";
import EmailList from "./components/email-list/EmailList.react";
import ListView from "./components/email-list/ListView.react";
import Response from "./components/Response.react";
import EmailVerification from "./components/EmailVerification.react";
import Profile from "./components/user/UserProfile.react";
import UserApi from "./API/UserApi";
import UserAction from "./actions/UserAction";
import UserStore from "./stores/UserStore";

function requireAuth(nextState, replace) {
  if(!($.isEmptyObject(UserStore.getUser()))) {
    return;
  }
  const cookie = document.cookie;
  const userId =
    cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  if(userId){
    UserApi.getUserDetail(userId).then((response) => {
      UserAction.setUserDetail(response.data);
    }, (err) => {
      replace("/login");
    });
  } else {
    replace("/login");
  }
  return;
}

const routes = (
<Route>
  <Route path="/" component={AppContainer}>
    <IndexRoute component={IndexPage} />
    <Route path="home" component={Home} onEnter={requireAuth}/>
    <Route path="emaillist" component={EmailList} onEnter={requireAuth}/>
    <Route path="response" component={Response} />
    <Route path="email-verified" component={EmailVerification} />
    <Route path="profile" component={Profile} onEnter={requireAuth}/>
    <Route path="/email-list/:listId" component={ListView} onEnter={requireAuth}/>
  </Route>
  <Route path="login" component={Login} />
  <Route path="signup" component={Signup} />
</Route>
);

module.exports = routes;
