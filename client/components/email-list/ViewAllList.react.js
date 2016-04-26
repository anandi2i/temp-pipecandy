import React from "react";
import {Link} from "react-router";
import Spinner from "../Spinner.react";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import EmailListGrid from "../grid/select-email-list/Grid.react";

function getAllEmailList() {
  EmailListActions.getAllEmailList();
}

class ListView extends React.Component {
  constructor(props) {
    super(props);
    getAllEmailList();
    this.state={
      allEmailLists: [],
    };
  }

  componentDidMount() {
    EmailListStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let emailLists = EmailListStore.getAllList();
    this.setState({
      allEmailLists: emailLists
    });
  }

  getGlobalData() {
    return {
      listLink: true
    };
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">All Email List</div>
            <div className="sub-head">
              <Link to="/list/create">Back to Create List</Link>
            </div>
          </div>
          {
            this.state.allEmailLists.length
              ?
                <EmailListGrid results={this.state.allEmailLists}
                globalData={this.getGlobalData()}/>
              : <div className="spaced"><Spinner /></div>
          }
        </div>
      </div>
    );
  }
}

export default ListView;
