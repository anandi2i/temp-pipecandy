import React from "react";

class CustomFailedCountComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * Render the custom row component on the single list view grid
   * @return {html} - div
   */
  render() {
    const isFailed = this.props.rowData.failedCount ?
    "failedCount tooltipped" : "";
    return (
      <div className={isFailed} data-position="top" data-tooltip="Some emails haven't been sent!">
        {this.props.rowData.status}
      </div>
    );
  }
}

export default CustomFailedCountComponent;
