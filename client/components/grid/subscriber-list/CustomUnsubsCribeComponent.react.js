import React from "react";

class CustomUnsubscribeComponent extends React.Component {
  constructor(props) {
    super(props);
  }
  /**
   * Render the custom row component on the single list view grid
   * @return {html} - div
   */
  render() {
    const unsubscribe = this.props.rowData.isUnsubscribed?
    "unsubscribe tooltipped" : "";
    return (
      <div className={unsubscribe} data-position="top" data-tooltip="Unsubscribed">
        {this.props.rowData.email}
      </div>
    );
  }
}

export default CustomUnsubscribeComponent;
