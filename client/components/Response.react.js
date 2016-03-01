import React from "react";

var Response = React.createClass({
  render: function() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              Signed up successfully
            </div>
            <div className="tag-sm-head m-t-20">
              Please check your email and click on the verification link before
              logging in.
            </div>
            <div className="center">
              <a className="btn blue m-t-50" href="/#/login" >Go to Login</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Response;
