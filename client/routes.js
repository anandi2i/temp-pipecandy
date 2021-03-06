import React from "react";
import {Router, Route, IndexRoute} from "react-router";
import _ from "underscore";
import AppContainer from "./components/AppContainer.react";
//import IndexPage from "./components/IndexPage.react";
import Home from "./components/Home.react";

//User routes
import UserApi from "./API/UserApi";
import UserAction from "./actions/UserAction";
import UserStore from "./stores/UserStore";
import Index from "./components/Index.react";
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
import AmplifiedList from "./components/email-list/ListWithAmplifiedList.react";
import BuildMasterList from "./components/email-list/BuildMasterList.react";

//Campaign
import CreateCampaign from "./components/campaign/CreateCampaign.react";
import RunCampaign from "./components/campaign/RunCampaign.react";
import ViewALLCampaign from "./components/campaign/ViewAllCampaign.react";
import ViewCampaign from
  "./components/campaign/campaign-report/ViewCampaign.react";
import CampaignInbox from
  "./components/campaign/campaign-report/CampaignInbox.react";
import CampaignSchedulebox from
  "./components/campaign/campaign-report/CampaignSchedulebox.react";
import CampaignSentbox from
  "./components/campaign/campaign-report/CampaignSentbox.react";

//Dashboard
import Dashboard from "./components/campaign/Dashboard.react";

//Unsubscribe
import Unsubscribe from "./components/Unsubscribe.react";

function requireAuth(nextState, replace) {
  UserStore.setPrevLocation(nextState.location.pathname);
  if(!(_.isEmpty(UserStore.getUser()))) {
    return;
  }
  if(getCookie("userId")) {
    UserApi.getUserDetail().then((response) => {
      UserAction.setUserDetail(response.data);
    }, (err) => {
      replace("/signup");
    });
  } else {
    if (nextState.location.pathname !== "/email-verified") {
      replace("/signup");
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
      /**
       * TODO master-list and AmplifiedList are for Demo purposes
       * Need to be removed
       */
      <Route path="master-list" component={BuildMasterList} />
      <Route path=":listId/AmplifiedList" component={AmplifiedList} />
    </Route>
    <Route path="campaign">
      <IndexRoute component={ViewALLCampaign} />
      <Route path="create" component={CreateCampaign} />
      <Route path=":id/run" component={RunCampaign} />
      <Route path=":id" component={ViewCampaign} />
      <Route path=":id/inbox" component={CampaignInbox} />
      <Route path=":id/scheduled" component={CampaignSchedulebox} />
      <Route path=":id/sent" component={CampaignSentbox} />
    </Route>
    <Route path="dashboard" component={Dashboard} />
    <Route path="response" component={Response} />
    <Route path="email-verified" component={EmailVerification} />
    <Route path="profile" component={Profile} />
    <Route path="reset-password-response" component={ResetPwdResponse} />
  </Route>
  <Route path="signup" component={Index} />
  <Route path="forgot-password" component={ForgotPassword} />
  <Route path="reset-password/:accessToken" component={ResetPassword} />
  <Route path="forgot-password-response" component={PasswordResponse} />
  <Route path="unsubscribe/:id" component={Unsubscribe} />
</Router>
);

module.exports = routes;
