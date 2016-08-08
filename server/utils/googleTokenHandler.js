"use strict";

var refresh = require("passport-oauth2-refresh");
var googleStrategy = require("passport-google-oauth2").Strategy;
var app = require("../../server/server.js");

const clientSecret = app.get("googleCredentials").installed.client_secret;
const clientId = app.get("googleCredentials").installed.client_id;

const updateAccessToken = (userIdentity, callback) => {
    let strategy = new googleStrategy({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: "/auth/google/callback"
    }, (accessToken, refreshToken, profile, done) => {
      console.log("Token Updated");
    });

    refresh.use("gmail", strategy);
    refresh.requestNewAccessToken("gmail",
          userIdentity.credentials.refreshToken, (err, accessToken) => {
      userIdentity.credentials.accessToken = accessToken;
      callback(null, userIdentity);
    });
};

module.exports = {
  updateAccessToken: updateAccessToken
};
