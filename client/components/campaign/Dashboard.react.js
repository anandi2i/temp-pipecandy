import React from "react";
import {Link} from "react-router";
import PerformanceCompare from "./performance/PerformanceCompare.react";
import OtherPerformanceStatus from "./performance/OtherPerformanceStatus.react";
import PerformanceReport from "./performance/PerformanceReport.react";

/**
 * Dashboard component to display campaign performance and other status
 */
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row sub-nav dashboard-head">
            <div className="head">Most recent campaign</div>
            <div className="caps-head">Conference follow-up for west coast participants</div>
            <div className="head">
              <ul className="separator">
                <li>1908 recipients<i className="mdi mdi-record"></i></li>
                <li>12 Dec 2015 1:10AM<i className="mdi mdi-record"></i></li>
                <li><a>View Details Report</a></li>
              </ul>
            </div>
            <div className="sub-head">
              <Link to="/list">Previous Campaign Reports</Link>
            </div>
          </div>
        </div>
        {/* Performance Compared Menu */}
        <PerformanceCompare />
        {/* Performance Chart */}
        <OtherPerformanceStatus />
        {/* Performance Chart */}
        <PerformanceReport />
      </div>
    );
  }
}

export default Dashboard;
