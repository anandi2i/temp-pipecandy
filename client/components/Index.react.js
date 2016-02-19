var React = require('react');

var Index = React.createClass({
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="./images/logo.png" />
              <div className="auth-form">
                <a className="btn auth-btn linkedin-btn" href="/auth/linkedin">
                  <i className="material-icons md-27 left">face</i> Sign in with linkedin
                </a>
                <a className="btn auth-btn google-btn" href="/auth/google">
                  <i className="material-icons md-27 left">face</i> Sign in with Google
                </a>
                <a className="btn auth-btn signin-btn" href="/signup">
                  Sign with your email
                </a>
              </div>
              <a href="/register.html">New user? Click here</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Index;
