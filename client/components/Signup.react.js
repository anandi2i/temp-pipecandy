import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../utils/ValidationMessages";
import UserAction from "../actions/UserAction";

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
  validatorTypes : {
    firstName: validatorUtil.firstName,
    email: validatorUtil.email,
    password: validatorUtil.password,
    lastName: validatorUtil.lastName
  },
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="./images/logo.png" />
              <form className="auth-form" id="form-validation"
                onSubmit={this.onSubmit}>
                <div className="input-field">
                  <input id="firstName" type="text"
                    className={
                      this.props.isValid("firstName")
                        ? "validate"
                        : "invalid"
                    }
                    name="First Name"
                    onChange={this.onChange("firstName")}
                    onBlur={this.props.handleValidation("firstName")} />
                  <label htmlFor="firstName">First Name</label>
                  {
                    !this.props.isValid("firstName")
                      ? this.renderHelpText("firstName")
                      : null
                  }
                </div>
                <div className="input-field">
                  <input id="lastName" type="text"
                    className={
                      this.props.isValid("lastName")
                        ? "validate"
                        : "invalid"
                    }
                    name="Last Name"
                    onChange={this.onChange("lastName")}
                    onBlur={this.props.handleValidation("lastName")} />
                  <label htmlFor="lastName">Last Name</label>
                  {
                    !this.props.isValid("lastName")
                    ? this.renderHelpText("lastName")
                    : null
                  }
                </div>
                <div className="input-field">
                  <input id="email" type="text"
                    className={
                      this.props.isValid("email")
                        ? "validate"
                        : "invalid"
                    }
                    name="email"
                    onChange={this.onChange("email")}
                    onBlur={this.props.handleValidation("email")} />
                  <label htmlFor="email">Email</label>
                  {
                    !this.props.isValid("email")
                      ? this.renderHelpText("email")
                      : null
                  }
                </div>
                <div className="input-field">
                  <input id="password" type="password"
                    className={
                      this.props.isValid("password")
                        ? "validate"
                        : "invalid"
                    }
                    name="password"
                    onChange={this.onChange("password")}
                    onBlur={this.props.handleValidation("password")} />
                  <label htmlFor="password">Password</label>
                  {
                    !this.props.isValid("password")
                      ? this.renderHelpText("password")
                      : null
                  }
                </div>
                <p className="show-pass">
                  <input type="checkbox" className="filled-in"
                    id="filled-in-box" defaultChecked="checked" />
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
  renderHelpText: function(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
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
    const formData = this.state;
    const onValidate = (error) => {
      if (!error) {
        UserAction.register(formData);
      }
    };
    this.props.validate(onValidate);
  }
});

module.exports = validation(strategy)(Signup);
