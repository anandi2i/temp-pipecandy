"use strict";

var refresh = require("passport-oauth2-refresh");
var googleStrategy = require("passport-google-oauth2").Strategy;
var config = require("../../server/config.json");

const clientSecret = config.googleCredentials.installed.client_secret;
const clientId = config.googleCredentials.installed.client_id;

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
