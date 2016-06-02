import React from "react";

class CustomSelectAllComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * It mangage the toggle select all row by the refs
   */
  toggleselectAllRow = () => {
    this.props.toggleSelectAllRow(
      this.refs.selectAllPeople.checked
    );
  }

  /**
   * Render the custom header component on the Single list view grid
   *
   * @return {html} - checkbox
   */
  render() {
    const checkedStatus = this.props.getIsAllRowChecked();
    return (
      <div className="row-table-cell valign-middle center grid-checkbox-column">
        <input
          type="checkbox"
          className="filled-in"
          id="selectAll"
          checked={checkedStatus}
          onChange={this.toggleselectAllRow}
          ref="selectAllPeople" />
          <label htmlFor="selectAll"></label>
      </div>
    );
  }
}

export default CustomSelectAllComponent;
