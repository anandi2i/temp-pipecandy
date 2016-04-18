import React from "react";
import autobind from "autobind-decorator";
import Spinner from "../Spinner.react";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import EmailListGrid from "../grid/select-email-list/Grid.react";

function getAllEmailList() {
  EmailListActions.getAllEmailList();
}

class SelectEmailList extends React.Component {
  constructor(props) {
    super(props);
    getAllEmailList();
    this.state = {
      allEmailLists: [],
      index: 1
    };
  }

  componentDidMount() {
    EmailListStore.addChangeListener(this._onEmailListChange);
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this._onEmailListChange);
  }

  @autobind
  _onEmailListChange() {
    let emailLists = EmailListStore.getAllList();
    this.setState({
      allEmailLists: emailLists
    });
  }

  render() {
    return (
      <div className="container" style={{display: this.props.active === this.state.index ? "block" : "none"}}>
        <h4> Select Email List </h4>
        {
          this.state.allEmailLists.length
            ?
              <EmailListGrid ref="emailListGrid" results={this.state.allEmailLists}/>
            : <div className="spaced"><Spinner /></div>
        }
      </div>
    );
  }
}

export default SelectEmailList;
