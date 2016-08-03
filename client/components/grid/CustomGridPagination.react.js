/**
 * @see: http://griddlegriddle.github.io/Griddle/customization.html
 */

import React from "react";
import GridStore from "../../stores/GridStore";

class CustomGridPagination extends React.Component {

  constructor(props) {
    super(props);
  }

  pageChange = (e) => {
    this.props.setPage(parseInt(e.target.getAttribute("data-value")));
  }

  render() {
    const {currentPage} = this.props;
    const maxPage = GridStore.getMaxPage() || this.props.maxPage;
    let lists = [];
    const defaultStartIndex = 0;
    const startIndexPoint = 3;
    const endIndexPoint = 6;
    const noOfButtonShow = 7;
    let startIndex = Math.max(currentPage - startIndexPoint, defaultStartIndex);
    let endIndex = Math.min(startIndex + noOfButtonShow, maxPage);
    if(maxPage >= noOfButtonShow && (endIndex - startIndex) <= endIndexPoint) {
      startIndex = endIndex - noOfButtonShow;
    }
    const onePage = 1;
    let increment = 1;
    if (maxPage !== onePage) {
      for(let i = startIndex; i < endIndex; i++) {
        const selected = currentPage === i ? "pager-active" : "pager-btn";
        lists.push(
          <li key={`page${i}`} className={selected} data-value={i}
            onClick={this.pageChange}>
            {i + increment}
          </li>
        );
      }
    }
    return (
      <div style={{display: lists.length ? "block" : "none"}} className="row">
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
