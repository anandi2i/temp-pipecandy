import React from "react";
import {Link} from "react-router";

var Index = React.createClass({
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="/images/logo.png" />
              <div className="auth-form">
                <a className="btn auth-btn linkedin-btn" href="/auth/linkedin">
                  <i className="left"><span className="linkedin-icon" /></i>
                  Sign in with linkedin
                </a>
                <a className="btn auth-btn google-btn" href="/auth/google">
                  <i className="left"><span className="google-icon" /></i>
                  Sign in with Google
                </a>
                <Link className="btn auth-btn signin-btn" to="/login">
                  Sign with your email
                </Link>
              </div>
              <Link to="/signup">New user? Click here</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Index;
