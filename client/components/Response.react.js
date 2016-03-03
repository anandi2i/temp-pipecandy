import React from "react";

var Response = React.createClass({
  render: function() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              Super. We’ve just sent an email. Click on the link in it and
              confirm your email address. Could you please?
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Response;
