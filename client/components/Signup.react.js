import React from "react";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import passwordStrength from "zxcvbn";
import validatorUtil from "../utils/ValidationMessages";
import UserAction from "../actions/UserAction";
import UserStore from "../stores/UserStore";

/*
 * Performs tasks related to signing up the user
 * that include fetching the user's firstname,lastname
 * and store it in the database
 */
class Signup extends React.Component {
  /**
   * @type {object}
   * @property {string} firstName - first name of the user
   * @property {string} lastName - last name of the user
   * @property {string} email - email of the user
   * @property {string} password - password of the user
   */
  constructor() {
    super();
    this.state = {
        firstName: "",
        email: "",
        password: "",
        lastName: "",
        checked: false
      };
    this.validatorTypes = {
      firstName: validatorUtil.firstName,
      email: validatorUtil.email,
      password: validatorUtil.password,
      lastName: validatorUtil.lastName
    };
  }

  /**
   * Validates the perticular state
   *
   * @return {object} that state being called
   */
  getValidatorData() {
    return this.state;
  }

  /**
   * Performs task of adding a listener that looks for errors occurrences
   */
  componentDidMount() {
    enableToolTip();
    UserStore.addChangeListener(this.onStoreChange);
  }

  /**
   * Performs task of removing a listener that looks for error occurrences
   */
  componentWillUnmount() {
    UserStore.removeChangeListener(this.onStoreChange);
  }

  /**
   * Receives the name of the validator to be checked and
   * returns error message if any
   *
   * @param {string} element - name of the validator
   * @return {HTML DIV} the error message if any for validator
   */
  renderHelpText(element) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(element)[0]}
      </div>
    );
  }

  /**
   * Changes the state when control leaves the input field
   *
   * @param {object} event - the current event
   * @param {string} field - name of the validator
   */
  onChange(e, field) {
    let state = {};
    state[field] = e.target.value;
    this.setState(state);
  }

  /**
   * Changes the state when checkbox is clicked
   *
   * @param {object} event - the current event
   */
  handleClick(event) {
    this.setState({checked: event.target.checked});
  }

  /**
   * Initiates the action that store the user information
   *
   * @param {object} event - the current event
   * @emits {object} the user details to be store in the database
   */
  onSubmit = (event) => {
    event.preventDefault();
    const formData = this.state;
    const onValidate = (error) => {
      if (!error) {
        UserAction.register(formData);
      }
    };
    this.props.validate(onValidate);
  }

  /**
   * Displays errors if any arise
   */
  onStoreChange = () => {
    displayError(UserStore.getError());
  }

  /**
   * render
   * @return {ReactElement}
   */
  render() {
    const pwdStrength = {"_0": 0, "_1": 1, "_2": 2, "_3": 3};
    let getScore = passwordStrength(this.state.password).score;
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
                    onChange={(e) => this.onChange(e, "firstName")}
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
                    onChange={(e) => this.onChange(e, "lastName")}
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
                  <div className="password-box tooltipped" data-position="bottom"
                    data-tooltip="Password strength" >
                    <div className={getScore > pwdStrength._3 ? "active" : null}></div>
                    <div className={getScore > pwdStrength._2 ? "active" : null}></div>
                    <div className={getScore > pwdStrength._1 ? "active" : null}></div>
                    <div className={getScore > pwdStrength._0 ? "active" : null}></div>
                  </div>
                  <input id="password" type={this.state.checked ? "text" : "password"}
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
                <p className="show-pass">
                  <input type="checkbox"
                    className="filled-in"
                    id="filled-in-box"
                    onClick={(e) => this.handleClick(e)}
                    checked={this.state.checked} />
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
}

export default validation(strategy)(Signup);
