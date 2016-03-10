import React from "react";
import {Link} from "react-router";
import autobind from "autobind-decorator";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";

function getEmailListByID() {
  return EmailListStore.getEmailListByID();
}

class ListView extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      emailList: getEmailListByID(),
      names: [],
      additionalFieldLen : 4
    };
  }

  componentDidMount() {
    EmailListActions.getEmailListByID(this.props.params.listId);
    EmailListStore.addChangeListener(this._onChange);
    $(".modal-trigger").leanModal();
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this._onChange);
  }

  @autobind
  _onChange() {
    let emailList = EmailListStore.getEmailListByID();
    this.setState({
      emailList: emailList
    });
  }

  @autobind
  addMoreFields() {
    let getLength = this.state.names.length;
    let maxLength = 5;
    if(getLength < maxLength){
      this.state.names.push(getLength);
      this.forceUpdate();
    }
  }

  @autobind
  getFieldState(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">{this.state.emailList.name}</div>
            <div className="sub-head">
              <Link to="/view-list">Back to Email Lists</Link>
            </div>
          </div>
          <div className="row r-btn-container m-lr-0">
            <a className="btn btn-dflt blue sm-icon-btn p-1-btn dropdown-button" data-activates="addDropDown">
              <i className="left mdi mdi-account-plus"></i> ADD
              <i className="right mdi mdi-chevron-down"></i>
            </a>
            <ul id="addDropDown" className="dropdown-content">
              <li><a className="modal-trigger" href="#addEmail">Add Subbscriber</a></li>
              <li><a href="#">Samle content</a></li>
            </ul>
            <a className="btn btn-dflt blue sm-icon-btn" href="#">
              <i className="left mdi mdi-upload"></i> add from file
            </a>
          </div>
          <div id="addEmail" className="modal modal-fixed-footer mini-modal">
            <div className="modal-content">
              <div className="gray-head">Add Subbscriber</div>
                <div className="input-field m-t-50">
                  <input placeholder="First Name" id="firstName" type="text"
                    onChange={this.getFieldState("firstName")}
                    className="validate" />
                  <label htmlFor="firstName">First Name</label>
                </div>
                <div className="input-field">
                  <input placeholder="Middle Name" id="middleName" type="text"
                    onChange={this.getFieldState("middleName")}
                    className="validate" />
                  <label htmlFor="middleName">Middle Name</label>
                </div>
                <div className="input-field">
                  <input placeholder="Last Name" id="lastName" type="text"
                    onChange={this.getFieldState("lastName")}
                    className="validate" />
                  <label htmlFor="lastName">Last Name</label>
                </div>
                <div className="input-field">
                  <input placeholder="Email" id="email" type="text"
                    onChange={this.getFieldState("email")}
                    className="validate" />
                  <label htmlFor="email">Email</label>
                </div>
                <div className="newFieldContainer">
                  <div className={this.state.names.length ? "show" : "hide"}>
                    <div className="row m-lr-0 m-t-20 m-b-50">
                      <div className="gray-head">Additional Fields</div>
                    </div>
                  </div>
                  {
                    this.state.names.map($.proxy(function (value, key) {
                      let minLen = 1;
                      let getLen = key + minLen;
                      let keyId = "fieldKey" + getLen;
                      let valueId = "fieldValue" + getLen;
                      return (
                        <div className="row m-lr-0" key={getLen}>
                          <div className="input-field">
                            <input placeholder="Field Name" id={keyId} type="text"
                              className="validate" />
                            <label className="active" htmlFor={keyId}>{"Field Name " + getLen}</label>
                          </div>
                          <div className="input-field">
                            <input placeholder="Value" id={valueId} type="text"
                              className="validate" />
                            <label className="active" htmlFor={valueId}>{"Value " + getLen}</label>
                          </div>
                        </div>
                      );
                    }, this))
                  }
                </div>
                <div className={this.state.names.length <= this.state.additionalFieldLen ? "show" : "hide"}>
                  <div onClick={this.addMoreFields} className="add-new-field">
                    <i className="mdi mdi-plus-circle"></i> Add a new fields
                  </div>
                </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" className="btn red modal-action modal-close p-1-btn" value="Add Another" />
              <input type="button" className="btn blue modal-action modal-close" value="OK" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ListView;
