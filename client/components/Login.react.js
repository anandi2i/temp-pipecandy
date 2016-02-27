import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../utils/ValidationMessages";
import UserAction from "../actions/UserAction";
import UserStore from "../stores/UserStore";

var Login = React.createClass({
  getInitialState: function() {
    return {
      email: "",
      password: ""
    };
  },
  getValidatorData: function() {
    return this.state;
  },
  validatorTypes : {
    email: validatorUtil["email"],
    password: validatorUtil["password"]
  },
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="/images/logo.png" />
              <form className="auth-form" id="loginForm" onSubmit={this.onSubmit}>
                <div className="input-field">
                  <input id="email" type="text"
                    className={this.props.isValid("email") ? "validate" : "invalid"}
                    name="email"
                    onChange={this.onChange("email")}
                    onBlur={this.props.handleValidation("email")} />
                  <label htmlFor="email">Email</label>
                  {!this.props.isValid("email") ? this.renderHelpText(this.props.getValidationMessages("email")) : null}
                </div>
                <div className="input-field">
                  <input id="password" type="password"
                    className={this.props.isValid("password") ? "validate" : "invalid"}
                    name="password"
                    onChange={this.onChange("password")}
                    onBlur={this.props.handleValidation("password")} />
                  <label htmlFor="password">Password</label>
                  {!this.props.isValid("password") ? this.renderHelpText(this.props.getValidationMessages("password")) : null}
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
  },
  renderHelpText: function(message) {
    return (
      <div className="warning-block">{message[0]}</div>
    );
  },
  onChange: function(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
  },
  onSubmit(event) {
    event.preventDefault();
    const onValidate = (error) => {
      if (!error) {
        UserApiAction.login({
          email: this.state.email,
          password: this.state.password
        });
      }
    };
    this.props.validate(onValidate);
  }
});

module.exports = validation(strategy)(Login);
