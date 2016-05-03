import React from "react";
import {Link} from "react-router";
import UserStore from "../stores/UserStore";

class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      userName: UserStore.getUser()
    };
  }

  componentWillUnmount() {
    UserStore.removeChangeListener(this.onStoreChange);
  }

  componentDidMount() {
    UserStore.addChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    this.setState({
      userName: UserStore.getUser()
    });
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              Hi&nbsp;
              {
                this.state.userName
                  ? this.state.userName.firstName
                  : "There"
              }!
              What do you want to do today?
            </div>
            <div className="row tab-hd-btn">
              <div className="col s12 m12 l6 right-align m-t-47">
                <Link className="btn lg-btn-dflt red" to="/campaign/create">
                  <i className="left mdi mdi-filter"></i> Create a Campaign
                  <i className="right mdi mdi-chevron-down"></i>
                </Link>
              </div>
              <div className="col s12 m12 l6 left-align m-t-47">
                <Link className="btn lg-btn-dflt blue" to="/">
                  Go to your Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div className="campaign-status-cont">
            <div className="gray-head"> Recent campaign stats </div>
            <div className="campaign-status">
              <ul>
                <li className="blue-head"> Conference follow-up for west coast participants </li>
                <li className="blue-txt"><i className="separator">&nbsp;</i> 1908 recipients</li>
                <li className="blue-txt"><i className="separator">&nbsp;</i>12 Dec 2015 1:10 AM</li>
              </ul>
              <div className="campaign-status-info center row">
                <div className="col s6 m4 l2">
                  <div className="info">Opened</div>
                  <div className="status">67</div>
                </div>
                <div className="col s6 m4 l2">
                  <div className="info">responded</div>
                  <div className="status">06</div>
                </div>
                <div className="col s6 m4 l2">
                  <div className="info">Clicked</div>
                  <div className="status">12</div>
                </div>
                <div className="col s6 m4 l2">
                  <div className="info">Bounced</div>
                  <div className="status">12</div>
                </div>
                <div className="col s6 m4 l2">
                  <div className="info">Unsubscribed</div>
                  <div className="status">09</div>
                </div>
                <div className="col s6 m4 l2">
                  <div className="info">Spam</div>
                  <div className="status">09</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
