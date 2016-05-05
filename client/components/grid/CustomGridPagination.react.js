import React from "react";

class CustomGridPagination extends React.Component {

  constructor(props) {
    super(props);
  }

  pageChange = (e) => {
    // value starts from 0... maxPage-1
    this.props.setPage(parseInt(e.target.getAttribute("data-value"), 5));
  }

  render() {
    let lists = [];
    let defaultStartIndex = 0;
    // update start index at after 4th button click but it's value is 3.
    // Pagination Value starts from 0...maxpage-1
    let startIndexPoint = 3;
    let endIndexPoint = 5;
    // Max button to be showed is 6
    let noOfButtonShow = 6;
    let startIndex = Math.max(
      this.props.currentPage - startIndexPoint, defaultStartIndex
    );
    let endIndex = Math.min(startIndex + noOfButtonShow, this.props.maxPage);
    if (this.props.maxPage >= noOfButtonShow &&
        (endIndex - startIndex) <= endIndexPoint) {
      startIndex = endIndex - startIndexPoint;
    }

    let checkIfOnePage = 1;
    let increment = 1;
    if (this.props.maxPage !== checkIfOnePage) {
      for (let i = startIndex; i < endIndex; i++) {
        lists.push(
        <li 
          key={`page${i}`} 
          className={
            this.props.currentPage === i 
            ? 
              "pager-active" 
            : 
              "pager-btn"
          }
          data-value={i}
          onClick={this.pageChange}>
          {i + increment}
        </li>
        );
      }
    }

    return (
      <div>
        {
          lists.length
          ?
            <div className="row">
              <div className="col s12">
                <ul className="pagination griddle-pager">
                  <span>Page&nbsp;</span>
                  {lists}
                </ul>
              </div>
            </div>
          :
            ""
        }
      </div>
    );
  }

}

CustomGridPagination.defaultProps = {
  "maxPage": 0,
  "currentPage": 0
};

export default CustomGridPagination;
