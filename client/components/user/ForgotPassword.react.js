import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import UserAction from "../../actions/UserAction";
import UserStore from "../../stores/UserStore";

class ForgotPassword extends React.Component {
  constructor() {
    super();
    this.state = {
      email: ""
    };
    this.validatorTypes = {
      email: validatorUtil.email
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
        UserAction.forgotPassword({
          email: this.state.email
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
  }
}

export default validation(strategy)(ForgotPassword);
