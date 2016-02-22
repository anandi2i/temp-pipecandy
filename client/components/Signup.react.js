var React = require('react');

var Signup = React.createClass({
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="/images/logo.png" />
              <form className="auth-form" action='/signup' method='post'>
                <div className="input-field">
                  <input id="firstName" type="text" className="validate" name="firstName" />
                  <label htmlFor="firstName">First name</label>
                </div>
                <div className="input-field">
                  <input id="lastName" type="text" className="validate" name="lastName" />
                  <label htmlFor="lastName">Last name</label>
                </div>
                <div className="input-field">
                  <input id="email" type="text" className="validate" name="email" />
                  <label htmlFor="email">Email</label>
                </div>
                <div className="input-field">
                  <input id="password" type="password" className="validate" name="password" />
                  <label htmlFor="password">Password</label>
                </div>
                <p className="show-pass">
                  <input type="checkbox" className="filled-in" id="filled-in-box" defaultChecked="checked" />
                  <label htmlFor="filled-in-box">Show password</label>
                </p>
                <button type="submit" className="btn auth-btn login-btn" >
                  sign up
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Signup;
