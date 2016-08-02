import React from "react";
import UserAction from "../actions/UserAction";

/**
 * Display Unsubscribe page after click unsubscribe link in email
 */
class Unsubscribe extends React.Component {
  constructor() {
    super();
  }

  componentWillMount() {
    const params = this.props.location.query;
    UserAction.unsubscribe({
      people: params.people,
      user: params.user,
      campaign: params.campaign
    });
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="tag-line">
            <div className="tag-head">
              You have been unsubscribed!
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Unsubscribe;
