import React from "react";
import ReactDOM from "react-dom";
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
      spinning: true
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".tooltipped").tooltip({delay: 50});
    EmailListStore.addChangeListener(this.onEmailListChange);
    getAllEmailList();
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onEmailListChange);
    removeMaterialTooltip();
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
    const draftEmailIndex = 2;
    return (
      <div className="container">
        <div className="row sub-head-container m-lr-0">
          <div className="head col s12 m10 l10">{"Select Email List(s)"}</div>
          <div className="col s12 m2 l2 p-0">
            <a className="blue right arrow-btn btn"
              onClick={() => this.props.handleClick(draftEmailIndex)}>
              Draft Email(s)
              <i className="mdi mdi-chevron-right right"></i>
            </a>
          </div>
        </div>
        <div className="container" style={{display: this.state.spinning ? "block" : "none"}}>
          <div className="spinner-container">
            <Spinner />
          </div>
        </div>
        {
          this.state.noDataBlock
          ?
            <NoDataComponent />
          :
          this.state.allEmailLists.length
          ?
            <EmailListGrid module="campaignRun" ref="emailListGrid" results={this.state.allEmailLists} />
          :
            ""
        }
      </div>
    );
  }
}

export default SelectEmailList;
