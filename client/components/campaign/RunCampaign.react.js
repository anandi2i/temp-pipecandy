import React from "react";
import {Link} from "react-router";
import autobind from "autobind-decorator";
// import CampaignActions from "../../actions/CampaignActions";
// import CampaignStore from "../../stores/CampaignStore";

class CreateCampaign extends React.Component {
  constructor(props) {
    super(props);
    this.state={};
  }

  componentDidMount() {
    enableNewTabs();
  }

  @autobind
  onChange(field) {
    return event => {
      let state = {};
      state[field] = event.target.value;
      this.setState(state);
    };
  }

  @autobind
  onSubmit(event) {
    event.preventDefault();
    const formData = {"name" : this.state.value};
    EmailListActions.createNewList(formData);
  }

  render() {
    return (
      <div>
        <div className="tab-container">
          <div className="new-tabs container">
            <div className="position active">1</div>
            <div className="tabs first-child active">select email list(s)</div>
            <div className="position">2</div>
            <div className="tabs">draft email(s)</div>
            <div className="position">3</div>
            <div className="tabs">schedule / send email</div>
          </div>
        </div>
        <div className="container">
          <div className="row sub-nav">
            <div className="head">Let’s create a new campaign</div>
            <div className="sub-head">
              <Link to="/campaign">View campaign</Link>
            </div>
          </div>
          <div className="create-container">
            <div className="row list-container">
              <form id="createCampaign" onSubmit={this.onSubmit}>
                <h3>
                  Name your new campaign
                </h3>
                <div className="input-field">
                  <input placeholder="Ex: Webinar Invitation, Feature updates, User Onboarding etc."
                    id="campaignName" type="text" />
                </div>
              <div className="row r-btn-container">
                <input type="submit" className="btn blue"
                  value="Save" />
              </div>
            </form>
            </div>
            <div className="hint-box m-t-47">
              A .csv file is just like an MS Excel file. If you have your list
              in MS Excel or a similar format, open it and save it as a .csv
              file. Please make all the changes you need to make before
              converting to .csv format (because .csv format does not save any
              changes you might make!)
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateCampaign;
