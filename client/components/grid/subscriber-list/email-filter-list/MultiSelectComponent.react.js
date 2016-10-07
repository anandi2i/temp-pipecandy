import React from "react";
import ReactDOM from "react-dom";


class MultiSelectComponent extends React.Component {
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
    console.log("hia", this.props);
    var listItems = this.props.data.list.map(function(item) {
      return (
        <a className="btn m-5 s12 m2 l2 funding-status" key={item.name}>
        {item.name}</a>
      );
    });
    return (
      <div className="card template-preview location">
        <div className="card-title">{this.props.data.name}
          <i className="material-icons fill-blue email-filter-close">
          close</i>
        </div>
        <div className="col s12  m-t-15 card-content">
          <div className="m-l-20 section row">
            {listItems}
          </div>
          {this.props.data.content}
        </div>
      </div>
    );
  }
}
export default (MultiSelectComponent);
