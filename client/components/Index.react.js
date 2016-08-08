import React from "react";

class Index extends React.Component {
  constructor() {
    super();
  }

  componentWillMount() {
    $("body").css({"overflow": "hidden"});
  }

  render() {
    return (
      <div>
        {/* TODO Login for linkedin and local signup
          <div className="center-container">
            <div className="center-div">
              <div className="auth-container">
                <img className="auth-logo" src="/images/logo.png" />
                <div className="auth-form">
                  <a className="btn auth-btn linkedin-btn" href="/auth/linkedin">
                    <i className="left"><span className="linkedin-icon" /></i>
                    Sign in with Linkedin
                  </a>
                  <a className="btn auth-btn google-btn" href="/auth/google">
                    <i className="left"><span className="google-icon" /></i>
                    Sign in with Google
                  </a>
                  <Link className="btn auth-btn signin-btn" to="/login">
                    Sign in with your email
                  </Link>
                </div>
                <Link to="/signup">New user? Click here</Link>
              </div>
            </div>
          </div>
        */}
        <div>
          <div className="navbar-fixed">
            <div className="top-candy-bdr"></div>
            <nav id="mainNav" className="no-brdr">
              <div className="nav-wrapper no-brdr">
                <a className="brand-logo active" href="#"><img className="img-blur" src="/images/logo.png" /></a>
                <ul className="right hide-on-med-and-down">
                  <span>
                    <li>
                      <a href="#" className="blur-blue">Dashboard</a>
                    </li>
                    <li><a href="#" className="blur-blue">Email Lists</a></li>
                    <li><a href="#" className="blur-blue">Campaigns</a></li>
                  </span>
                  <li className="user-pic hide-on-med-and-down">
                    <a className="dropdown-button" data-activates="userDropDown">
                    <img src="/images/photo.png" alt="" className="circle img-blur" />
                    <i className="mdi mdi-chevron-down blur-blue"></i>
                    </a>
                  </li>
                </ul>
                <a data-activates="main-side-nav" className="side-nav-btn active" href="#">
                <i className="mdi mdi-menu blur-blue"></i>
                </a>
              </div>
            </nav>
          </div>
          <ul id="main-side-nav" className="side-nav">
            <span>
              <li className="user-pic side-nav-user-pic hide-on-large-only blur-blue">
                <img src="/api/containers/1/download/photo.png" alt="" className="circle img-blur" />
                <i className="mdi mdi-chevron-down blur-blue"></i>
              </li>
              <li>
                <a href="#" className="blur-blue">Dashboard</a>
              </li>
              <li>
                <a href="#" className="blur-blue">Email Lists</a>
              </li>
              <li><a href="#" className="blur-blue">Campaigns</a></li>
            </span>
          </ul>
        </div>
        <div>
          <div>
            <div className="container">
              <div className="row sub-nav dashboard-head no-brdr">
                <div className="head blur-black">Funded Startups</div>
                <div className="head campaign-detail-section">
                  <ul className="separator">
                    <li className="blur-gray">
                      Sent to 5 lists
                      <i className="mdi mdi-record blur-gray"></i> 500 recipients
                      <i className="mdi mdi-record blur-gray"></i>
                    </li>
                    <li><a className="blur-gray">View Details Report</a></li>
                  </ul>
                </div>
                <div className="sub-head"><a href="#" className="blur-blue">Previous Campaign Reports</a></div>
              </div>
            </div>
            <div>
              <div className="container">
                <div className="row main-head blur-black">Campaign stats</div>
                <div className="row camp-chip-container no-brdr">
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">opened</div>
                      <div className="count">
                        <div className="blur-blue">50</div>
                        <span className="blur-gray">250</span>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">unopened</div>
                      <div className="count">
                        <div className="blur-blue">50</div>
                        <span className="blur-gray">250</span>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">clicked</div>
                      <div className="count">
                        <div className="blur-blue">20</div>
                        <span className="blur-gray">100</span>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">actionable responses</div>
                      <div className="count">
                        <div className="blur-blue">10</div>
                        <span className="blur-gray">50</span>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">bounced</div>
                      <div className="count">
                        <div className="blur-blue">0.10</div>
                        <span className="blur-gray">10</span>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">unsubscribed</div>
                      <div className="count">
                        <div className="blur-blue">0</div>
                        <span className="blur-gray">0</span>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="camp-chip no-brdr">
                      <div className="head blur-black">spam</div>
                      <div className="count">
                        <div className="blur-blue">0</div>
                        <span className="blur-gray">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="container">
              <div>
                <div className="row main-head blur-black">Other stats</div>
                <div className="row tag-name-menu">
                  <ul>
                    <li className="blur-gray">Show status for</li>
                    <li className="menu blur-green">Last 1 Month</li>
                  </ul>
                </div>
                <div className="row camp-chip no-brdr-container">
                  <div className="col s12 m3 s3">
                    <div className="other-status">
                      <div className="container">
                        <div className="head blur-black">emails sent</div>
                        <div className="value">
                          <div className="blur-black">250</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="other-status">
                      <div className="container">
                        <div className="head blur-black">emails delivered</div>
                        <div className="value">
                          <div className="blur-black">250</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="other-status">
                      <div className="container">
                        <div className="head blur-black">warm responses</div>
                        <div className="value">
                          <div className="blur-black">100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col s12 m3 s3">
                    <div className="other-status">
                      <div className="container">
                        <div className="head blur-black">followups done</div>
                        <div className="value">
                          <div className="blur-black">100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="g-signup lean-overlay" style={{display:"block"}}>
          <div className="center-container">
            <div className="center-div">
              <div className="auth-container">
                <img className="auth-logo" src="/images/logo.png" />
                <div className="auth-form">
                  <a className="btn auth-btn google-btn" href="/auth/google">
                    <i className="left"><span className="google-icon" /></i>
                    Sign in with Google
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Index;
