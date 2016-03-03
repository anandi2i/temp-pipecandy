import React from "react";

var EmailVerification = React.createClass({
  render: function() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              Hurray! We’ve verified your email address!
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = EmailVerification;
