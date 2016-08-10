import React from "react";
import {Link} from "react-router";
import strategy from "joi-validation-strategy";
import validation from "react-validation-mixin";
import validatorUtil from "../../utils/ValidationMessages";
import EmailListActions from "../../actions/EmailListActions";
import EmailListStore from "../../stores/EmailListStore";

class EmailList extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      listName: "",
    };
    this.validatorTypes = {
     listName: validatorUtil.listName,
    };
  }

  getValidatorData() {
    return this.state;
  }

  componentDidMount() {
    EmailListStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this.onStoreChange);
  }

  handleChange(e, field) {
    let state = {};
    state[field] = e.target.value;
    this.setState(state);
  }

  onSubmit = (e) => {
    e.preventDefault();
    const onValidate = (error) => {
      if (!error) {
        EmailListActions.createNewList({"name" : this.state.listName});
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
    displayError(EmailListStore.getError());
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-nav">
            <div className="head">Let’s create an email list</div>
            <div className="sub-head">
              <Link to="/list">View lists</Link>
            </div>
          </div>
          <div className="create-container m-t-45">
            <h3>
              Name your new list
            </h3>
            <div className="row list-container">
              <form id="createEmailList" onSubmit={this.onSubmit}>
                <div className="input-field">
                  <input placeholder="Ex: List of CIOs I met at the Presidential Dinner"
                    id="listName" type="text"
                    name="List Name"
                    className={
                      this.props.isValid("listName")
                        ? "validate" : "invalid"
                    }
                    value={this.state.listName}
                    onChange={(e) => this.handleChange(e, "listName")}
                    onBlur={this.props.handleValidation("listName")} />
                  {
                    !this.props.isValid("listName")
                      ? this.renderHelpText("listName")
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

export default validation(strategy)(EmailList);
