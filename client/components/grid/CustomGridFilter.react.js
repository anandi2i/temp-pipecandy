import React from "react";
import autobind from "autobind-decorator";

class GridFilter extends React.Component {
  
  constructor(props) {
    super(props);
  }

  @autobind
  handleChange(evt) {
    this.props.changeFilter(evt.target.value);
  }

  render() {
    return (
      <div className="col m5 s12 filter-container">
        <input 
          id="grid_filter"
          type="search"
          name="search"
          placeholder={this.props.placeholderText}
          onChange={this.handleChange} />
        <label htmlFor="grid_filter"></label>
      </div>
    );
  }

}

GridFilter.defaultProps = {
  "placeholderText": "Search..."
};

export default GridFilter;
