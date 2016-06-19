import React from "react";
import {Router, Route, IndexRoute} from "react-router";
import AppContainer from "./components/AppContainer.react";
//import IndexPage from "./components/IndexPage.react";
import Home from "./components/Home.react";

//User routes
import UserApi from "./API/UserApi";
import UserAction from "./actions/UserAction";
import UserStore from "./stores/UserStore";
import Index from "./components/Index.react";
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
import CreateEmailList from "./components/email-list/CreateEmailList.react";
import ViewAllList from "./components/email-list/ViewAllList.react";
import ViewSingleList from "./components/email-list/ViewSingleList.react";

//Campaign
import CreateCampaign from "./components/campaign/CreateCampaign.react";
import RunCampaign from "./components/campaign/RunCampaign.react";
import ViewALLCampaign from "./components/campaign/ViewAllCampaign.react";
import ViewCampaign from
  "./components/campaign/campaign-report/ViewCampaign.react";
import CampaignInbox from
  "./components/campaign/campaign-report/CampaignInbox.react";
import CampaignOutbox from
  "./components/campaign/campaign-report/CampaignOutbox.react";

//Dashboard
import Dashboard from "./components/campaign/Dashboard.react";

function requireAuth(nextState, replace) {
  UserStore.setPrevLocation(nextState.location.pathname);
  if(!($.isEmptyObject(UserStore.getUser()))) {
    return;
  }
  if(getCookie("userId")) {
    UserApi.getUserDetail().then((response) => {
      UserAction.setUserDetail(response.data);
    }, (err) => {
      replace("/register");
    });
  } else {
    if (nextState.location.pathname !== "/email-verified") {
      replace("/register");
    }
  }
  return;
}

const routes = (
<Router>
  <Route path="/" component={AppContainer} onEnter={requireAuth}>
    <IndexRoute component={Home} />
    <Route path="list">
      <IndexRoute component={ViewAllList} />
      <Route path="create" component={CreateEmailList} />
      <Route path=":listId" component={ViewSingleList} />
    </Route>
    <Route path="campaign">
      <IndexRoute component={ViewALLCampaign} />
      <Route path="create" component={CreateCampaign} />
      <Route path=":id/run" component={RunCampaign} />
      <Route path=":id" component={ViewCampaign} />
      <Route path=":id/inbox" component={CampaignInbox} />
      <Route path=":id/outbox" component={CampaignOutbox} />
    </Route>
    <Route path="dashboard" component={Dashboard} />
    <Route path="response" component={Response} />
    <Route path="email-verified" component={EmailVerification} />
    <Route path="profile" component={Profile} />
    <Route path="reset-password-response" component={ResetPwdResponse} />
  </Route>
  <Route path="register" component={Index} />
  <Route path="login" component={Login} />
  <Route path="signup" component={Signup} />
  <Route path="forgot-password" component={ForgotPassword} />
  <Route path="reset-password/:accessToken" component={ResetPassword} />
  <Route path="forgot-password-response" component={PasswordResponse} />
</Router>
);

module.exports = routes;
