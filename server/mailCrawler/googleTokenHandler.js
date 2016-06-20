import refresh from "passport-oauth2-refresh";
import {Strategy as googleStrategy} from "passport-google-oauth2";

const clientSecretCredentials = {
  "web": {
    "client_id": "478206392598-0uq1vtkne494bdhnlb1k4fjson3shjap\
.apps.googleusercontent.com",
    "project_id": "pipecandy-1294",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "-9z-cU18aImvflghMHWaz4oW",
    "redirect_uris": [
      "http://staging.pipecandy.com/auth/google/callback",
      "http://localhost:3001/auth/google/callback",
      "http://pipecandy.com/auth/google/callback",
      "http://localhost:3000/auth/google/callback",
      "http://localhost:3000/auth/google?access_type=offline"
    ]
  }
};

const clientSecret = clientSecretCredentials.web.client_secret;
const clientId = clientSecretCredentials.web.client_id;

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
