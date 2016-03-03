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
                <Link className="btn auth-btn linkedin-btn" to="/auth/linkedin">
                  <i className="left"><span className="linkedin-icon" /></i>
                  Sign in with linkedin
                </Link>
                <Link className="btn auth-btn google-btn" to="/auth/google">
                  <i className="left"><span className="google-icon" /></i>
                  Sign in with Google
                </Link>
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
