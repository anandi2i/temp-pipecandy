import React from "react";
import {Link} from "react-router";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import CampaignActions from "../../actions/CampaignActions";
import CampaignStore from "../../stores/CampaignStore";

class CreateCampaign extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      campaignName: ""
    };
    this.validatorTypes = {
      campaignName: validatorUtil.campaignName,
    };
  }

  getValidatorData() {
    return this.state;
  }

  onChange(e, field) {
    let state = {};
    state[field] = e.target.value;
    this.setState(state);
  }

  componentDidMount() {
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  handleChange = (event) => {
    this.setState({campaignName: event.target.value});
  }

  onSubmit = (e) => {
    e.preventDefault();
    const onValidate = (error) => {
      if (!error) {
        CampaignActions.createNewCampaign({
          "name" : this.state.campaignName
        });
      }
    };
    this.props.validate(onValidate);
  }

  renderHelpText(el) {
    return (
      <div className="warning-block">
        {this.props.getValidationMessages(el)[0]}
      </div>
    );
  }

  onStoreChange = () => {
    displayError(CampaignStore.getError());
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-nav">
            <div className="head">Let’s create a new campaign</div>
            <div className="sub-head">
              <Link to="/campaign">View all campaigns</Link>
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
                    id="campaignName" type="text"
                    name="Campaign Name"
                    className={
                      this.props.isValid("campaignName")
                        ? "validate" : "invalid"
                    }
                    value={this.state.campaignName}
                    onChange={(e) => this.onChange(e, "campaignName")}
                    onBlur={this.props.handleValidation("campaignName")} />
                  {
                    !this.props.isValid("campaignName")
                      ? this.renderHelpText("campaignName")
                      : null
                  }
                </div>
                <div className="row r-btn-container">
                  <input type="submit" className="btn blue"
                    value="Save" />
                </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default validation(strategy)(CreateCampaign);
