import React from "react";
import UserStore from "../stores/UserStore";
import UserAction from "../actions/UserAction";
import autobind from "autobind-decorator";

class Header extends React.Component {
  constructor(props) {
    super(props);
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
              <a href="/#/home" className="brand-logo">
                <img src="/images/logo.png" />
              </a>
              <ul className="right hide-on-med-and-down">
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Campaigns</a></li>
                <li><a href="/#/emaillist">Email Lists</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">API</a></li>
                <li><a onClick={this.logout} >Logout</a></li>
                <li className="alarm">
                  <a href="#">
                    <i className="mdi mdi-bell-outline" ><div className="alarm-info">22</div></i>
                  </a>
                </li>
                <li className="user-pic">
                  <a className="dropdown-button" data-activates='userDropDown' href="#">
                    <img src="/images/user.png" width="30px" alt="" className="circle" />
                    <i className="mdi mdi-chevron-down"></i>
                  </a>
                </li>
              </ul>
              <ul id='userDropDown' className='dropdown-content'>
                <li><a href="#!">one</a></li>
                <li><a href="#!">two</a></li>
                <li><a href="#!">three</a></li>
              </ul>
              <ul id="main-side-nav" className="side-nav">
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Campaigns</a></li>
                <li><a href="/emaillist">Email Lists</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">API</a></li>
                <li className="alarm"><a href="#"><i className="mdi mdi-bell-outline" ><div className="alarm-info">22</div></i></a></li>
              </ul>
              <a href="#" data-activates="main-side-nav" className="side-nav-btn"><i className="mdi mdi-menu"></i></a>
            </div>
          </nav>
        </div>
      </div>
    );
  }
}

export default Header;
