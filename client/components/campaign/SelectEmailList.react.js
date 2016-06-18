import React from "react";
import Spinner from "../Spinner.react";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";
import EmailListGrid from "../grid/select-email-list/Grid.react";
import NoDataComponent
  from "../grid/select-email-list/CustomNoDataComponent.react";

function getAllEmailList() {
  EmailListActions.getAllEmailList();
}

class SelectEmailList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allEmailLists: [],
      noDataBlock: false,
      spinning: true,
      index: 1
    };
  }

  componentDidMount() {
    EmailListStore.addChangeListener(this.onEmailListChange);
    getAllEmailList();
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onEmailListChange);
  }

  onEmailListChange = () => {
    let emailLists = EmailListStore.getAllList();
    this.setState({
      allEmailLists: emailLists,
      noDataBlock: emailLists.length ? false : true,
      spinning: false
    });
  }

  render() {
    return (
      <div className="container" style={{display: this.props.active === this.state.index ? "block" : "none"}}>
        <h4> Select Email List </h4>
        <div className="spaced" style={{display: this.state.spinning ? "block" : "none"}}>
          <Spinner />
        </div>
        {
          this.state.noDataBlock 
          ?
            <NoDataComponent />
          :
          this.state.allEmailLists.length
          ?
            <EmailListGrid ref="emailListGrid" results={this.state.allEmailLists} />
          :
            ""
        }
      </div>
    );
  }
}

export default SelectEmailList;
