import React from "react";
import {Link} from "react-router";
import autobind from "autobind-decorator";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";

function getAllEmailList() {
  return EmailListStore.getAllList();
}

class ListView extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      allEmailLists: getAllEmailList(),
    };
  }

  componentDidMount() {
    EmailListActions.getAllEmailList();
    EmailListStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this._onChange);
  }

  @autobind
  _onChange() {
    let emailLists = EmailListStore.getAllList();
    this.setState({
      allEmailLists: emailLists
    });
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">All Email List</div>
            <div className="sub-head">
              <Link to="/create-list">Back to Create List</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ListView;
