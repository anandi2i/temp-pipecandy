import React from "react";

class Reviewer extends React.Component {
  render() {
    return (
      <div>
        <div> Reviewers list </div>
        <ol>
          {
            this.props.reviewers.map(function (reviewer) {
              return (
                <li>{reviewer.name} - {reviewer.email}</li>
              );
            })
          }
        </ol>
      </div>
    );
  }
}

export default Reviewer;
