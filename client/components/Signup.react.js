import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../utils/ComponentUtils.js";

var Signup = React.createClass({
  getInitialState: function() {
    return {
      firstName: "",
      email: "",
      password: "",
      lastName: ""
    };
  },
  getValidatorData: function() {
    return this.state;
  },
  validatorTypes : validatorUtil,
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="./images/logo.png" />
              <form className="auth-form" id="form-validation" action="/signup" method="post" onSubmit={this.onSubmit}>
                <div className="input-field">
                  <input  id="firstName" type="text"
                    className={this.props.isValid("firstName") ? "validate" : "invalid"}
                    name="First Name"
                    onChange={this.onChange("firstName")}
                    onBlur={this.props.handleValidation("firstName")} />
                  <label htmlFor="firstName">First Name</label>
                  {this.renderHelpText(this.props.getValidationMessages("firstName"))}
                </div>
                <div className="input-field">
                  <input id="lastName" type="text"
                    className={this.props.isValid("lastName") ? "validate" : "invalid"}
                    name="Last Name"
                    onChange={this.onChange("lastName")}
                    onBlur={this.props.handleValidation("lastName")} />
                  <label htmlFor="lastName">Last Name</label>
                  {this.renderHelpText(this.props.getValidationMessages("lastName"))}
                </div>
                <div className="input-field">
                  <input id="email" type="text"
                    className={this.props.isValid("email") ? "validate" : "invalid"}
                    name="email"
                    onChange={this.onChange("email")}
                    onBlur={this.props.handleValidation("email")} />
                  <label htmlFor="email">Email</label>
                  {this.renderHelpText(this.props.getValidationMessages("email"))}
                </div>
                <div className="input-field">
                  <input id="password" type="password"
                    className={this.props.isValid("password") ? "validate" : "invalid"}
                    name="password"
                    onChange={this.onChange("password")}
                    onBlur={this.props.handleValidation("password")} />
                  <label htmlFor="password">Password</label>
                  {this.renderHelpText(this.props.getValidationMessages("password"))}
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
        $("#form-validation").submit();
      }
    };
    this.props.validate(onValidate);
  }
});

module.exports = validation(strategy)(Signup);
