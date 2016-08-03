import React from "react";
import {Link} from "react-router";
import Spinner from "../Spinner.react";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import GridStore from "../../stores/GridStore";
import EmailListGrid from "../grid/select-email-list/Grid.react";

function getAllEmailList() {
  EmailListActions.getAllEmailList();
}

class ListView extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      allEmailLists: [],
      spinning: true
    };
  }

  componentDidMount() {
    EmailListStore.addChangeListener(this.onStoreChange);
    getAllEmailList();
  }

  componentWillUnmount() {
    GridStore.removeSelectedEmailListIds();
    EmailListStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let emailLists = EmailListStore.getAllList();
    this.setState({
      allEmailLists: emailLists,
      spinning: false
    });
  }

  getGlobalData = () => {
    return {
      listLink: true
    };
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-head-container m-lr-0">
            <div className="head">All Email Lists</div>
            <div className="sub-head">
              <Link to="/list/create">Create Email List</Link>
            </div>
          </div>
          <div className="spaced" style={{display: this.state.spinning ? "block" : "none"}}>
            <Spinner />
          </div>
          <EmailListGrid results={this.state.allEmailLists}
            globalData={this.getGlobalData} />
        </div>
      </div>
    );
  }
}

export default ListView;
