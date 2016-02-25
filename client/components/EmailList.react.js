import React from "react";
import Autosuggest from "react-autosuggest";
import EmailListActions from "../actions/EmailListActions";
import EmailListStore from "../stores/EmailListStore";
import autobind from "autobind-decorator";

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g,/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestions(value, allEmailList) {
  const escapedValue = escapeRegexCharacters(value.trim());
  if (escapedValue === "") {
    return [];
  }
  const regex = new RegExp("^" + escapedValue, "i");
  return allEmailList.filter(emailList => regex.test(emailList.name));
}

function getEmailListFromStore() {
  return EmailListStore.getEmailList();
}

//http://react-autosuggest.js.org/
//http://codepen.io/moroshko/pen/LGNJMy
class EmailList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
      suggestions: getSuggestions(""),
      emailList: getEmailListFromStore()
    };
  }

  componentDidMount() {
    EmailListStore.addChangeListener(this._onChange);
    EmailListActions.getAllEmailList();
  }

  componentWillUnmount() {
    EmailListStore.removeChangeListener(this._onChange);
  }

  @autobind
  _onChange() {
    this.setState({
      emailList: getEmailListFromStore()
    });
  }

  @autobind
  onChange(event, { newValue, method }) {
    this.setState({
      value: newValue
    });
  }

  @autobind
  onSuggestionsUpdateRequested({ value }) {
    this.setState({
      suggestions: getSuggestions(value, this.state.emailList)
    });
  }

  @autobind
  renderSuggestion(suggestion) {
    return (
      <span>{suggestion.name}</span>
    );
  }

  @autobind
  getSuggestionValue(suggestion) {
    return suggestion.name;
  }

  render() {
    const { value, suggestions } = this.state;
    const inputProps = {
      placeholder: "Ex: List of CIOs I met at the Presidential Dinner",
      id: "list",
      value,
      onChange: this.onChange
    };
    return (
      <div>
        <div className="container">
          <div className="row sub-nav">
            <div className="head">Let’s create a list</div>
            <div className="sub-head">
              <a href="#">View lists</a>
            </div>
          </div>
          <div className="create-list-container">
            <h3>Name your new list (or) select an existing list by typing the list name to update it</h3>
            <div className="row list-container">
              <div className="input-field">
                <Autosuggest suggestions={suggestions}
                  onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
                  getSuggestionValue={this.getSuggestionValue}
                  renderSuggestion={this.renderSuggestion}
                  inputProps={inputProps} />
              </div>
              <div className="row r-btn-container">
                <input type="button" className="btn red p-1-btn" value="Upload csv File" />
                <input type="button" className="btn blue" value="Add subscribers one by one" />
              </div>
            </div>
            <div className="hint-box m-t-50">
              A .csv file is just like an MS Excel file. If you have your list in MS Excel or a similar format, open it and save it as a .csv file. Please make all the changes you need to make before converting to .csv format (because .csv format does not save any
              changes you might make!)
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EmailList;
