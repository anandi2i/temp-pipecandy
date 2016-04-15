import React from "react";
import autobind from "autobind-decorator";

class CustomGridPagination extends React.Component {
  
  constructor(props) {
    super(props);
  }

  @autobind
  pageChange(event) {
    // value starts from 0... maxPage-1
    this.props.setPage(parseInt(event.target.getAttribute("data-value"), 5));
  }

  render() {
    let lists = [];
    let temp = 0;
    // update start index at after 4th button click but it's value is 3.
    // Pagination Value starts from 0...maxpage-1
    let startIndexPoint = 3;
    let endIndexPoint = 5;
    // Max button to be showed is 6
    let noOfButtonShow = 6;
    let startIndex = Math.max(this.props.currentPage - startIndexPoint, temp);
    let endIndex = Math.min(startIndex + noOfButtonShow, this.props.maxPage);
    if (this.props.maxPage >= noOfButtonShow && 
        (endIndex - startIndex) <= endIndexPoint) {
      startIndex = endIndex - startIndexPoint;
    }

    let sum = 1;
    for (let i = startIndex; i < endIndex; i++) {
      let sel = this.props.currentPage === i ? "pager-active" : "pager-btn";
      lists.push(
        <li key={`page${i}`} className={sel} data-value={i} 
          onClick={this.pageChange}>{i + sum}</li>
      );
    }
    return (
      <div className="row">
        <div className="col s12">
          <ul className="pagination griddle-pager">
            <span>Page&nbsp;</span>
            {lists}
          </ul>
        </div>
      </div>
    );
  }

}

CustomGridPagination.defaultProps = {
  "maxPage": 0,
  "currentPage": 0
};

export default CustomGridPagination;
