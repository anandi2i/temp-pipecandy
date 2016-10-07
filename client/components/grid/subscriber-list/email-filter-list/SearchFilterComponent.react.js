import React from "react";
import ReactDOM from "react-dom";


class SearchFilterComponent extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
  }
  /**
   * Initialize the lean modal and custom scrollbar and other third party
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  render() {
    return (
      <div className="card template-preview location">
        <div className="card-title">{this.props.data.name}
          <i className="material-icons fill-blue email-filter-close">
          close</i>
        </div>
        <div className="col s12  m-t-15 card-content">
          <div className="chips email-filter-locations-initial"></div>
          {this.props.data.content}
        </div>
      </div>
    );
  }
}
export default (SearchFilterComponent);
