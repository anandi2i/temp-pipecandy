import React from "react";

var PasswordResponse = React.createClass({
  render: function() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              We’ve just sent an email. Click on the link in it and
              reset your password. Could you please?
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = PasswordResponse;
