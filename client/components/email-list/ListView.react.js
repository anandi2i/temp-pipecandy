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
      emailList: getEmailListByID()
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

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">{this.state.emailList.name}</div>
            <div className="sub-head">
              <Link to="/emaillist">Back to Email Lists</Link>
            </div>
          </div>
          <div className="row r-btn-container m-lr-0">
            <a className="btn btn-dflt blue sm-icon-btn p-1-btn modal-trigger" href="#addEmail">
              <i className="left mdi mdi-account-plus"></i> ADD
              <i className="right mdi mdi-chevron-down"></i>
            </a>
            <a className="btn btn-dflt blue sm-icon-btn" href="#">
              <i className="left mdi mdi-upload"></i> add from file
            </a>
          </div>
          <div id="addEmail" className="modal">
            <div className="modal-content">
              <div className="gray-head">Add Subbscriber</div>
                <div className="input-field m-t-50">
                  <input placeholder="First Name" id="firstName" type="text" className="validate" />
                  <label htmlFor="firstName">First Name</label>
                </div>
                <div className="input-field">
                  <input placeholder="Middle Name" id="middleName" type="text" className="validate" />
                  <label htmlFor="middleName">Middle Name</label>
                </div>
                <div className="input-field">
                  <input placeholder="Last Name" id="lastName" type="text" className="validate" />
                  <label htmlFor="lastName">Last Name</label>
                </div>
                <div className="input-field">
                  <input placeholder="Email" id="email" type="text" className="validate" />
                  <label htmlFor="email">Email</label>
                </div>
            </div>
            <div className="modal-footer r-btn-container">
              <input type="button" className="btn blue modal-action modal-close p-1-btn" value="OK" />
              <input type="button" className="btn red modal-action modal-close" value="Add Another" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ListView;
