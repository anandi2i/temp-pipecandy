var React = require('react');

var Login = React.createClass({
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="./images/logo.png" />
              <form className="auth-form" action='/login' method='post'>
                <div className="input-field">
                  <input id="email" type="email" name="email" className="validate" />
                  <label htmlFor="email">Email address</label>
                </div>
                <div className="input-field">
                  <input id="password" type="password" name="password" className="validate" />
                  <label htmlFor="password">Password</label>
                </div>
                <button type="submit" className="btn auth-btn login-btn">
                  Login
                </button>
                <div className="auth-cnter-pnl">
                  <a href="#" className="left">Forgot password?</a>
                  <span className="right">
                    <input type="checkbox" className="filled-in" id="filled-in-box" defaultChecked="checked" />
                    <label htmlFor="filled-in-box">Remember me</label>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Login;
