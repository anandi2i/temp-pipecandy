import React from "react";
import ReactDOM from "react-dom";
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
                <li><Link onClick={this.logout} to="/signup" activeClassName="active">Logout</Link></li>
              </ul>
              <Link to="#" activeClassName="active" data-activates="main-side-nav"
                className="side-nav-btn">
                <i className="mdi mdi-menu"></i>
              </Link>
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
    this.state=({
      isNotification: false
    });
  }

  componentDidUpdate(){
    enableSideNavDropDown();
  }

  openNotification = () => {
    this.setState({
      isNotification: true
    });
  }

  /**
   * Remove notification container after close
   */
  closeCallback = () => {
    this.setState({
      isNotification: false
    });
  }

  render () {
    let avatarStyle = {
      backgroundImage: "url(" + this.props.user.avatar + ")"
    };
    const {isNotification} = this.state;
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
              <li><Link onClick={this.logout} to="/signup" activeClassName="active">Logout</Link></li>
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
            <li>
              <a onClick={this.openNotification}>
                <i className="mdi mdi-bell-outline notification"></i>
                {/*<span className="notification-count">
                  Notification Count</span> */}
              </a>
            </li>
            {
              isNotification
              ? <Notification ref="notification"
                closeCallback={this.closeCallback}/>
              : ""
            }
          </span>
        :
          <span>
            <li><Link to="/signup" activeClassName="active">Signup</Link></li>
          </span>
    );
  }
}

//TODO Need to rework on this.
class Notification extends React.Component {
  constructor(props) {
    super(props);
    this.state=({
      notificationView: "bounceInRight"
    });
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".notify-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * Close modal popup
   * Call closeCallback to remove notification in parent container
   */
  closeModal = () => {
    const timeDelay = 1000;
    this.setState({
      notificationView: "bounceOutRight"
    }, () => {
      const props = this.props;
      setTimeout(function() {props.closeCallback();}, timeDelay);
    });
  }

  render () {
    const {notificationView} = this.state;
    return (
      <div className={`notification-container animated ${notificationView}`}>
        <div className="notification-modal">
          <div className="head">
            <span className="left">
              <i className="mdi mdi-bell"></i>
              <span className="notify-titl">Notifications (Coming Soon!)</ span>
            </span>
            <span className="right">
              <i className="mdi mdi-close" onClick={() => this.closeModal()}></i>
            </span>
          </div>
          {/*<div className="notify-content">
            <div className="notify new">
              <div className="title"></div>
              <div className="content"></div>
            </div>
            <div className="notify old">
              <div className="title"></div>
              <div className="content"></div>
            </div>
          </div>*/}
        </div>
      </div>
    );
  }
}
