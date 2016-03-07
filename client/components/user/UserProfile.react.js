import React from "react";
import ReactDom from "react-dom";
import autobind from "autobind-decorator";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import AvatarCropper from "react-avatar-cropper";
import passwordStrength from "zxcvbn";
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
    let user = UserStore.getUser();
    this.state = {
      "id": user.id,
      "firstName" : user.firstName,
      "lastName" : user.lastName,
      "email" : user.email,
      "cropperOpen": false,
      "img": null,
      "croppedImg": user.avatar || ""
    };
  }
  @autobind
  handleFileChange(dataURI) {
    this.setState({
      img: dataURI,
      croppedImg: this.state.croppedImg,
      cropperOpen: true
    });
  }
  @autobind
  handleCrop(dataURI) {
    this.setState({
      cropperOpen: false,
      img: dataURI,
      croppedImg: dataURI
    });
  }
  @autobind
  handleRequestHide() {
    this.setState({cropperOpen: false});
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this._onChange);
  }

  componentDidMount() {
    enableToolTipInJSX();
    UserStore.addChangeListener(this._onChange);
  }

  @autobind
  _onChange() {
    let user = UserStore.getUser();
    //TODO need to refresh image URL without page load to avoid set img state in croppedImg
    this.setState({
      "id": user.id,
      "firstName" : user.firstName,
      "lastName" : user.lastName,
      "email" : user.email,
      "cropperOpen": false,
      "img": null,
      "croppedImg": this.state.img || user.avatar
    });
    let error = UserStore.getError();
    this.displayError(error);
  }

  @autobind
  displayError(error) {
    const timeToShow = 4000;
    if (error) {
      Materialize.toast(error, timeToShow);
    }
  }

  @autobind
  onSubmit(event) {
    event.preventDefault();
    const onValidate = (error) => {
      if (!error) {
        if ((this.state.newPassword && this.state.oldPassword) ||
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

  @autobind
  triggerFile() {
    $("#selectAvatar").trigger("click");
  }

  render() {
    let avatarStyle = {
      backgroundImage: "url(" + this.state.croppedImg + ")"
    };
    let canvasSize = 300;
    const pwdStrength = {"_0": 0, "_1": 1, "_2": 2, "_3": 3};
    let getScore = this.state.newPassword
      ? passwordStrength(this.state.newPassword).score : pwdStrength._0;
    return (
      <div>
        <div className="container">
          <div className="row sub-nav">
            <div className="head">Edit Profile</div>
          </div>
          <form className="user-profile" id="loginForm"
            onSubmit={this.onSubmit}>
            <div className="row">
              <div className="col s12 l4 m5">
                <div className="avatar-container">
                  <FileUpload handleFileChange={this.handleFileChange} />
                  <div onClick={this.triggerFile} className="avatar-pic"
                    style={avatarStyle}>
                    <div className="avatar-edit">
                      <span>Click to Pick Avatar</span>
                    </div>
                  </div>
                </div>
                {this.state.cropperOpen &&
                  <AvatarCropper
                    onRequestHide={this.handleRequestHide}
                    cropperOpen={this.state.cropperOpen}
                    onCrop={this.handleCrop}
                    image={this.state.img}
                    width={canvasSize}
                    height={canvasSize} />
                }
              </div>
              <div className="col s12 l8 m7">
                <div className="input-field">
                  <input id="firstName" placeholder="First Name"
                    type="text"
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
                  {!this.props.isValid("firstName")
                    ? this.renderHelpText("firstName")
                    : null
                  }
                </div>
                <div className="input-field">
                  <input id="lastName" placeholder="Last Name"
                    type="text"
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
                  {!this.props.isValid("lastName")
                    ? this.renderHelpText("lastName")
                    : null
                  }
                </div>
                <div className="input-field">
                  <input disabled id="email" placeholder="Email"
                    type="email" value={this.state.email}
                    className="validate" name="email" />
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
                  {!this.props.isValid("oldPassword")
                    ? this.renderHelpText("oldPassword")
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
                  <input id="newPass" type="password"
                    className={
                      this.props.isValid("newPassword")
                        ? "validate"
                        : "invalid"
                    }
                    name="new password" onChange={this.onChange("newPassword")}
                    onBlur={this.props.handleValidation("newPassword")} />
                  <label htmlFor="password">New Password</label>
                  {!this.props.isValid("newPassword")
                    ? this.renderHelpText("newPassword")
                    : null
                  }
                </div>
              </div>
            </div>
            <div className="row right" id="toast-container"></div>
            <div className="row r-btn-container m-0">
              <input type="button" className="btn red p-1-btn" value="Cancel" />
              <input type="submit" className="btn blue" value="Save Changes" />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

let FileUpload = React.createClass({

  handleFile: function(e) {
    let reader = new FileReader();
    let file = e.target.files[0];
    let minFileSize = 9999;

    if (!file)
      return;

    if (file.size <= minFileSize) {
      const timeToShow = 4000;
      Materialize.toast("Select file size more the 10kb", timeToShow);
      return;
    }

    reader.onload = function(img) {
      ReactDom.findDOMNode(this.refs.in).value = "";
      this.props.handleFileChange(img.target.result);
    }.bind(this);
    reader.readAsDataURL(file);
  },

  render: function() {
    return (
      <input ref="in" type="file" accept="image/*"
        id="selectAvatar" onChange={this.handleFile} />
    );
  }
});

export default validation(strategy)(Profile);
