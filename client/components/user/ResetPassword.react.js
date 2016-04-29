import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import UserAction from "../../actions/UserAction";
import UserStore from "../../stores/UserStore";

class ResetPassword extends React.Component {
  constructor() {
    super();
    this.state = {
      accessToken: this.props.params.accessToken,
      password: ""
    };
    this.validatorTypes = {
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
        UserAction.resetPassword({
          accessToken: this.state.accessToken,
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
                  Reset Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default validation(strategy)(ResetPassword);
