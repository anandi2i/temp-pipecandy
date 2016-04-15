import React from "react";

class CustomNoDataComponent extends React.Component {
  render() {
    return (
      <div className="row card">
        <div className="col s12 center card-content">
          <p>No data is available</p>
        </div>
      </div>
    );
  }
}

export default CustomNoDataComponent;
