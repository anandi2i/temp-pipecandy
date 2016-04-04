import React from "react";
import {Link} from "react-router";
import autobind from "autobind-decorator";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";

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
              <Link to="/list/create">Back to Create List</Link>
            </div>
          </div>
          <table className="striped">
            <thead>
              <tr>
                <th data-field="id">Id</th>
                <th data-field="name">Name</th>
                <th data-field="edit">Edit</th>
              </tr>
            </thead>
            <tbody>
              {
                this.state.allEmailLists.map(function (list, key) {
                  return (
                    <tr key={key}>
                      <td>{list.id}</td>
                      <td>{list.name}</td>
                      <td><Link to={`/list/${list.id}`}>view</Link></td>
                    </tr>
                  );
                }, this)
              }
          </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ListView;
