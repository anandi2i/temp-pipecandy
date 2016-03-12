import React from "react";
import {Route, IndexRoute} from "react-router";
import cookie from "react-cookie";
import AppContainer from "./components/AppContainer.react";
import IndexPage from "./components/IndexPage.react";
import Home from "./components/Home.react";

//User routes
import UserApi from "./API/UserApi";
import UserAction from "./actions/UserAction";
import UserStore from "./stores/UserStore";
import Login from "./components/Login.react";
import Signup from "./components/Signup.react";
import Profile from "./components/user/UserProfile.react";
import Response from "./components/Response.react";
import EmailVerification from "./components/EmailVerification.react";
import ForgotPassword from "./components/user/ForgotPassword.react";
import ResetPassword from "./components/user/ResetPassword.react";
import PasswordResponse from "./components/user/PasswordResponse.react";
import ResetPwdResponse from "./components/user/ResetPasswordResponse.react";

//Email List
import EmailList from "./components/email-list/CreateEmailList.react";
import ViewAllList from "./components/email-list/ViewAllList.react";
import ViewSingleList from "./components/email-list/ViewSingleList.react";

//Campaign
import CreateCampaign from "./components/campaign/CreateCampaign.react";
import RunCampaign from "./components/campaign/RunCampaign.react";

function requireAuth(nextState, replace) {
  if(!($.isEmptyObject(UserStore.getUser()))) {
    return;
  }
  const userId = cookie.load("userId");
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
    <Route path="home" component={Home} onEnter={requireAuth} />
    <Route path="create-list" component={EmailList} onEnter={requireAuth} />
    <Route path="view-list" component={ViewAllList} onEnter={requireAuth} />
    <Route path="email-list/:listId" component={ViewSingleList} onEnter={requireAuth} />
    <Route path="create-campaign" component={CreateCampaign} onEnter={requireAuth} />
    <Route path="run-campaign" component={RunCampaign} onEnter={requireAuth} />
    <Route path="response" component={Response} />
    <Route path="email-verified" component={EmailVerification} />
    <Route path="profile" component={Profile} onEnter={requireAuth} />
    <Route path="reset-password-response" component={ResetPwdResponse} />
  </Route>
  <Route path="login" component={Login} />
  <Route path="signup" component={Signup} />
  <Route path="forgot-password" component={ForgotPassword} />
  <Route path="reset-password/:accessToken" component={ResetPassword} />
  <Route path="forgot-password-response" component={PasswordResponse} />
</Route>
);

module.exports = routes;
