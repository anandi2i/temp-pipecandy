import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import UserAction from "../../actions/UserAction";
import UserStore from "../../stores/UserStore";

var ResetPassword = React.createClass({
  getInitialState: function() {
    return {
      accessToken: this.props.params.accessToken,
      password: ""
    };
  },
  getValidatorData: function() {
    return this.state;
  },
  validatorTypes : {
    password: validatorUtil.password
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
        UserAction.resetPassword({
          accessToken: this.state.accessToken,
          password: this.state.password
        });
      }
    };
    this.props.validate(onValidate);
  },
  _onChange() {
    let error = UserStore.getError();
    const timeToShow = 4000;
    if(error) {
      Materialize.toast(error, timeToShow);
    }
  }
});

module.exports = validation(strategy)(ResetPassword);
