var React = require('react');

var Login = React.createClass({
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="./images/logo.png" />
              <div className="auth-form">
                <div className="input-field">
                  <input id="email" type="email" className="validate" />
                  <label htmlFor="email">Email address</label>
                </div>
                <div className="input-field">
                  <input id="password" type="password" className="validate" />
                  <label htmlFor="password">Password</label>
                </div>
                <a className="btn auth-btn login-btn" href="/register.html">
                  Login
                </a>
                <div className="auth-cnter-pnl">
                  <a href="#" className="left">Forgot password?</a>
                  <span className="right">
                    <input type="checkbox" className="filled-in" id="filled-in-box" defaultChecked="checked" />
                    <label htmlFor="filled-in-box">Remember me</label>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Login;
