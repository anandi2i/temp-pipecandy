var React = require("react");

var EmailList = React.createClass({
  render: function() {
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
                <input id="list" type="text" className="validate" placeholder="Ex: List of CIOs I met at the Presidential Dinner" />
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
});

module.exports = EmailList;
