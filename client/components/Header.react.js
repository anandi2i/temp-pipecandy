import React from "react";
import {Link} from "react-router";
import UserAction from "../actions/UserAction";
import UserStore from "../stores/UserStore";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      user: UserStore.getUser()
    };
  }

  componentDidMount() {
    enableSideNavDropDown();
    UserStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this.onStoreChange);
  }

  componentDidUpdate(){
    enabledropDownBtn();
  }

  onStoreChange = () => {
    this.setState({
      user: UserStore.getUser()
    });
  }

  logout = () => {
    UserAction.logout();
  }

  render () {
    const {user} = this.state;
    return (
      <div>
        <div className="navbar-fixed">
          <div className="top-candy-bdr"></div>
          <nav id="mainNav">
            <div className="nav-wrapper">
              <Link to="/" className="brand-logo" activeClassName="active">
                <img src="/images/logo.png" />
              </Link>
              <ul className="right hide-on-med-and-down">
                <Menu user={user} />
                {user && user.firstName ?
                <li className="user-pic hide-on-med-and-down">
                  <a className="dropdown-button" data-activates="userDropDown">
                    <img src={user.avatar} alt="" className="circle" />
                    <i className="mdi mdi-chevron-down"></i>
                  </a>
                </li> : ""}
              </ul>
              <ul id="userDropDown" className="dropdown-content">
                <li><Link to="/profile">Profile</Link></li>
                <li><Link onClick={this.logout} to="/login" activeClassName="active">Logout</Link></li>
              </ul>
              <a activeClassName="active" data-activates="main-side-nav" className="side-nav-btn"><i className="mdi mdi-menu"></i></a>
            </div>
          </nav>
        </div>
        <ul id="main-side-nav" className="side-nav">
          <Menu user={user} />
        </ul>
      </div>
    );
  }
}

export default Header;

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state={};
  }

  componentDidUpdate(){
    enableSideNavDropDown();
  }

  render () {
    let avatarStyle = {
      backgroundImage: "url(" + this.props.user.avatar + ")"
    };
    return (
      this.props.user.firstName
        ?
          <span>
            {/* only for side nav - start here*/}
            <li className="user-pic side-nav-user-pic hide-on-large-only" style={avatarStyle} >
              <img src={this.props.user.avatar} alt="" className="circle" />
              <i className="mdi mdi-chevron-down"></i>
            </li>
            <div className="side-nav-drop-down hide-on-large-only">
              <li><Link to="/profile">Profile</Link></li>
              <li><Link onClick={this.logout} to="/login" activeClassName="active">Logout</Link></li>
            </div>
            {/* side nav - end here */}
            <li>
              <Link to="/dashboard" activeClassName="active">Dashboard</Link>
            </li>
            <li>
              <Link to="/list" activeClassName="active">Email Lists</Link>
            </li>
            <li>
              <Link to="/campaign" activeClassName="active">Campaigns</Link>
            </li>
          </span>
        :
          <span>
            <li><Link to="/login" activeClassName="active">Login</Link></li>
            <li><Link to="/signup" activeClassName="active">Signup</Link></li>
          </span>
    );
  }
}
