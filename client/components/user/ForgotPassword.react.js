import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import UserAction from "../../actions/UserAction";
import UserStore from "../../stores/UserStore";

var ForgotPassword = React.createClass({
  getInitialState: function() {
    return {
      email: ""
    };
  },
  getValidatorData: function() {
    return this.state;
  },
  validatorTypes : {
    email: validatorUtil.email
  },
  componentDidMount: function() {
    UserStore.addChangeListener(this._onChange);
  },
  componentWillUnmount: function() {
    UserStore.removeChangeListener(this._onChange);
  },
  render: function() {
    return (
      <div>
        <div className="center-container">
          <div className="center-div">
            <div className="auth-container">
              <img className="auth-logo" src="/images/logo.png" />
              <form className="auth-form" id="loginForm"
                onSubmit={this.onSubmit}>
                <div className="input-field">
                  <input id="email" type="text"
                    className={
                      this.props.isValid("email") ? "validate" : "invalid"
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
                <div id="toast-container"></div>
                <button type="submit" className="btn auth-btn login-btn">
                  Reset Password
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
    const onValidate = (error) => {
      if (!error) {
        UserAction.forgotPassword({
          email: this.state.email
        });
      }
    };
    this.props.validate(onValidate);
  },
  _onChange() {
    displayError(UserStore.getError());
  }
});

module.exports = validation(strategy)(ForgotPassword);
