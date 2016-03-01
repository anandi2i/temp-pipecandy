import React from "react";

var EmailVerification = React.createClass({
  render: function() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              Registration verified successfully
            </div>
            <div className="tag-sm-head m-t-20">
              You are now ready to <a href="/#/login">Login</a>.
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = EmailVerification;
