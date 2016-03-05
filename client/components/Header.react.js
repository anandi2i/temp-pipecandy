import React from "react";
import UserAction from "../actions/UserAction";
import autobind from "autobind-decorator";
import UserStore from "../stores/UserStore";
import {Link} from "react-router";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      user: UserStore.getUser()
    };
  }

  componentDidMount() {
    UserStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this._onChange);
  }

  @autobind
  _onChange() {
    //console.log("hererere",UserStore.getUser());
    this.setState({
      user: UserStore.getUser()
    });
  }

  @autobind
  logout(){
    UserAction.logout();
  }

  render () {
    return (
      <div>
        <div className="navbar-fixed">
          <div className="top-candy-bdr"></div>
          <nav id="mainNav">
            <div className="nav-wrapper">
              <Link to="/home" className="brand-logo" activeClassName="active">
                <img src="/images/logo.png" />
              </Link>
              {
                this.state.user.firstName
                  ? <ul className="right hide-on-med-and-down">
                      <li><Link to="/emaillist" activeClassName="active">Email Lists</Link></li>
                      <li><Link to="/profile" activeClassName="active">Profile</Link></li>
                      <li><Link onClick={this.logout} to="/login" activeClassName="active">Logout</Link></li>
                      <li className="user-pic">
                        <Link className="dropdown-button" data-activates="userDropDown" to="/profile">
                          <img src="/images/user.png" width="30px" alt="" className="circle" />
                          <i className="mdi mdi-chevron-down"></i>
                        </Link>
                      </li>
                    </ul>
                  : <ul className="right hide-on-med-and-down">
                      <li><Link to="/login" activeClassName="active">Login</Link></li>
                      <li><Link to="/signup" activeClassName="active">Signup</Link></li>
                    </ul>
              }
              <ul id="userDropDown" className="dropdown-content">
                <li><Link to="/!">one</Link></li>
                <li><Link to="/!">two</Link></li>
                <li><Link to="/!">three</Link></li>
              </ul>
              <ul id="main-side-nav" className="side-nav">
                <li><Link to="/emaillist" activeClassName="active">Email Lists</Link></li>
              </ul>
              <Link to="/" activeClassName="active" data-activates="main-side-nav" className="side-nav-btn"><i className="mdi mdi-menu"></i></Link>
            </div>
          </nav>
        </div>
      </div>
    );
  }
}

export default Header;
