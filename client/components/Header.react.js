import React from "react";
import UserAction from "../actions/UserAction";
import autobind from "autobind-decorator";
import {Link} from "react-router";

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
              <Link to="/home" className="brand-logo" activeClassName="active">
                <img src="/images/logo.png" />
              </Link>
              <ul className="right hide-on-med-and-down">
                <li><Link to="/" activeClassName="active">Dashboard</Link></li>
                <li><Link to="/" activeClassName="active">Campaigns</Link></li>
                <li><Link to="/emaillist" activeClassName="active">Email Lists</Link></li>
                <li><Link to="/" activeClassName="active">Pricing</Link></li>
                <li><Link to="/" activeClassName="active">API</Link></li>
                <li><Link onClick={this.logout} to="/" activeClassName="active">Logout</Link></li>
                <li className="alarm">
                  <Link to="/" activeClassName="active">
                    <i className="mdi mdi-bell-outline" ><div className="alarm-info">22</div></i>
                  </Link>
                </li>
                <li className="user-pic">
                  <Link className="dropdown-button" data-activates="userDropDown" to="/profile">
                    <img src="/images/user.png" width="30px" alt="" className="circle" />
                    <i className="mdi mdi-chevron-down"></i>
                  </Link>
                </li>
              </ul>
              <ul id="userDropDown" className="dropdown-content">
                <li><Link to="/!">one</Link></li>
                <li><Link to="/!">two</Link></li>
                <li><Link to="/!">three</Link></li>
              </ul>
              <ul id="main-side-nav" className="side-nav">
                <li><Link to="/" activeClassName="active">Dashboard</Link></li>
                <li><Link to="/" activeClassName="active">Campaigns</Link></li>
                <li><Link to="/emaillist" activeClassName="active">Email Lists</Link></li>
                <li><Link to="/" activeClassName="active">Pricing</Link></li>
                <li><Link to="/" activeClassName="active">API</Link></li>
                <li className="alarm"><Link to="/" activeClassName="active"><i className="mdi mdi-bell-outline" ><div className="alarm-info">22</div></i></Link></li>
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
