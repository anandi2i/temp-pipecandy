import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../utils/ValidationMessages";
import UserAction from "../actions/UserAction";
import UserStore from "../stores/UserStore";
import {Link} from "react-router";

class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      email: "",
      password: ""
    };
    this.validatorTypes = {
      email: validatorUtil.email,
      password: validatorUtil.password
    };
  }

  getValidatorData() {
    return this.state;
  }

  componentDidMount() {
    UserStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this.onStoreChange);
  }

  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  onChange(e, field) {
    let state = {};
    state[field] = e.target.value;
    this.setState(state);
  }

  onSubmit = (event) => {
    event.preventDefault();
    const onValidate = (error) => {
      if (!error) {
        UserAction.login({
          email: this.state.email,
          password: this.state.password
        });
      }
    };
    this.props.validate(onValidate);
  }

  onStoreChange() {
    displayError(UserStore.getError());
  }

  render() {
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
                    onChange={(e) => this.onChange(e, "email")}
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
                    onChange={(e) => this.onChange(e, "password")}
                    onBlur={this.props.handleValidation("password")} />
                  <label htmlFor="password">Password</label>
                  {
                    !this.props.isValid("password")
                      ? this.renderHelpText("password")
                      : null
                  }
                </div>
                <button type="submit" className="btn auth-btn login-btn">
                  Login
                </button>
                <div className="auth-cnter-pnl">
                  <Link to="/forgot-password" className="left">Forgot password?</Link>
                  <span className="right">
                    <input type="checkbox" className="filled-in"
                      id="filled-in-box" defaultChecked="checked" />
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
}

export default validation(strategy)(Login);
