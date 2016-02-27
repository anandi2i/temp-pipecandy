var React = require('react');

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
                <a className="btn auth-btn signin-btn" href="/#/login">
                  Sign with your email
                </a>
              </div>
              <a href="/#/signup">New user? Click here</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Index;