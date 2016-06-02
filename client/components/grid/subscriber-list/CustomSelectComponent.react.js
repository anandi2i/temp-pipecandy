import React from "react";

class CustomSelectComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * It manage the toggle single select row
   */
  selectPeople = () => {
    this.props.metadata.globalData().toggleSelectRow(
      this.props.rowData,
      this.refs.selectPeople.checked
    );
  }

  /**
   * Render the cusom row component on the single list view grid
   *
   * @return {html} - checkbox
   */
  render() {
    const data = this.props.rowData;
    const checkBoxId = this.props.data;
    const checkedStatus =
      this.props.metadata.globalData().getIsRowChecked(data);
    return (
      <div className="row-table-cell valign-middle center grid-checkbox-column">
        <input
          name="peopleCheck"
          type="checkbox"
          className="filled-in"
          id={checkBoxId}
          checked={checkedStatus}
          onChange={this.selectPeople}
          ref="selectPeople" />
          <label htmlFor={checkBoxId}></label>
      </div>
    );
  }
}

export default CustomSelectComponent;
