import React from "react";
import autobind from "autobind-decorator";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import UserStore from "../../stores/UserStore";
import UserAction from "../../actions/UserAction";

class Profile extends React.Component {

  constructor(props) {
    super(props);
    this.validatorTypes = {
      "firstName": validatorUtil.firstName,
      "lastName": validatorUtil.lastName,
      "oldPassword": validatorUtil.newPassword,
      "newPassword": validatorUtil.newPassword
    };
    this.state = UserStore.getUser();
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this._onChange);
  }

  componentDidMount() {
    UserStore.addChangeListener(this._onChange);
  }

  @autobind
  _onChange() {
    this.setState(UserStore.getUser());
    let error = UserStore.getError();
    this.displayError(error);
  }

  @autobind
  displayError(error){
    const timeToShow = 4000;
    if(error) {
      Materialize.toast(error, timeToShow);
    }
  }

  @autobind
  onSubmit(event) {
    event.preventDefault();
    const onValidate = (error) => {
      if (!error) {
        if((this.state.newPassword && this.state.oldPassword) ||
          (!this.state.newPassword && !this.state.oldPassword)) {
            let formData = this.state;
            UserAction.userUpdate(formData);
        } else {
          this.displayError("Please enter both password fields");
        }
      }
    };
    this.props.validate(onValidate);
  }

  @autobind
  onChange(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
  }

  @autobind
  getValidatorData() {
    return this.state;
  }

  @autobind
  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-nav">
            <div className="head">Edit Profile</div>
          </div>
          <form className="user-profile" id="loginForm" onSubmit={this.onSubmit}>
            <div className="row">
              <div className="col s12 l6 m6">
                <div className="input-field">
                  <input id="firstName" placeholder="First Name" type="text"
                    className={
                      this.props.isValid("firstName")
                        ? "validate"
                        : "invalid"
                    }
                    value={this.state.firstName}
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
                    <input id="lastName" placeholder="Last Name" type="text"
                      className={
                        this.props.isValid("lastName")
                          ? "validate"
                          : "invalid"
                      }
                      value={this.state.lastName}
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
                    <input disabled id="email" placeholder="Email" type="email"
                      value={this.state.email} className="validate"
                      name="email"/>
                    <label htmlFor="email">Email</label>
                  </div>
                  <div className="input-field">
                    <input id="oldPass" type="password"
                      className={
                        this.props.isValid("oldPassword")
                          ? "validate"
                          : "invalid"
                      }
                      name="old password"
                      onChange={this.onChange("oldPassword")}
                      onBlur={this.props.handleValidation("oldPassword")} />
                    <label htmlFor="password">Old Password</label>
                    {
                      !this.props.isValid("oldPassword")
                        ? this.renderHelpText("oldPassword")
                        : null
                    }
                  </div>
                  <div className="input-field">
                    <input id="newPass" type="password"
                      className={
                        this.props.isValid("newPassword")
                          ? "validate"
                          : "invalid"
                      }
                      name="new password"
                      onChange={this.onChange("newPassword")}
                      onBlur={this.props.handleValidation("newPassword")} />
                    <label htmlFor="password">New Password</label>
                    {
                      !this.props.isValid("newPassword")
                        ? this.renderHelpText("newPassword")
                        : null
                    }
                  </div>
                </div>
              <div className="col s12 l6 m6"></div>
            </div>
            <div className="row" id="toast-container"></div>
            <div className="row r-btn-container">
              <input type="button" className="btn red p-1-btn" value="Cancel"/>
              <input type="submit" className="btn blue" value="Save Changes"/>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
export default validation(strategy)(Profile);
