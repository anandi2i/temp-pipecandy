import React from "react";
import ReactDOM from "react-dom";
import {Link} from "react-router";

class BuildMasterList extends React.Component {
  constructor(props) {
    console.log("segdrg");
    /**
     * Initial state values
     * @property {array} emailContent
     */
    super(props);
    this.state = {
      isDisplay: false
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
  }

  showResult = () => {
    this.setState({
      isDisplay: !this.state.isDisplay
    });
  }

  render() {
    const {isDisplay} = this.state;
    return (
      <div>
        <div className="container view-single-list-containter">
          <div className="row sub-head-container m-lr-0">
            <div className="head">Build From Master</div>
            <div className="sub-head">
              <Link to="/list">Back to Email Lists</Link>
            </div>
          </div>
          <div className="master-list-filter row">
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">Tamil Nadu</option>
                  <option value="2">Karnataka</option>
                  <option value="3">Delhi</option>
                </select>
                <label>Location</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">Chennai</option>
                  <option value="2">Bangalore</option>
                  <option value="3">Mumbai</option>
                </select>
                <label>City</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">Retail</option>
                  <option value="2">Manufacturing</option>
                  <option value="3">Healthcare</option>
                </select>
                <label>Industry</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">Chief Information officer</option>
                  <option value="2">Chief Technology officer</option>
                  <option value="3">VP-Engineering</option>
                </select>
                <label>Title</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">0 - 10</option>
                  <option value="2">10 - 25</option>
                  <option value="3">25 - 50</option>
                  <option value="3">50+</option>
                </select>
                <label>No.of Employees</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">NodeJs</option>
                  <option value="2">Java</option>
                  <option value="3">Ruby On Rails</option>
                </select>
                <label>Technology Used</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field">
                <select>
                  <option value="1">$0-$1 million</option>
                  <option value="2">$1-$5</option>
                  <option value="3">$5-$10</option>
                </select>
                <label>Funding</label>
              </div>
            </div>
            <div className="col s3">
              <div className="input-field right">
                <input type="button" onClick={() => this.showResult()}
                  className="btn blue" value="Show Results" />
              </div>
            </div>
          </div>
        <div style={{display: isDisplay ? "block" : "none"}}>
            <div className="griddle">
                <div className="top-section">
                    <div className="griddle-filter">
                        <div className="filter-container">
                            <input type="text" name="filter" placeholder="SEARCH BY NAME OR EMAIL" className="form-control" />
                        </div>
                    </div>
                    <div className="griddle-settings-toggle"></div>
                </div>
                <div className="griddle-container">
                    <div className="griddle-body">
                        <div>
                            <table className="responsive-table">
                                <thead>
                                    <tr>
                                        <th data-title="select" className="select">
                                            <div className="row-table-cell valign-middle center grid-checkbox-column">
                                                <input type="checkbox" className="filled-in" id="selectAll" />
                                                <label htmlFor="selectAll"></label>
                                            </div>
                                        </th>
                                        <th data-title="firstName" className="name"><span>First Name</span><span className="mdi mdi-arrow-up"></span></th>
                                        <th data-title="middleName" className="name"><span>Middle Name</span><span className="mdi mdi-arrow-up"></span></th>
                                        <th data-title="lastName" className="name"><span>Last Name</span><span className="mdi mdi-arrow-up"></span></th>
                                        <th data-title="email" className="email"><span>e-mail</span><span className="mdi mdi-arrow-up"></span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="standard-row">
                                        <td className="select">
                                            <div className="row-table-cell valign-middle center grid-checkbox-column">
                                                <input type="checkbox" name="peopleCheck" className="filled-in" id="4" />
                                                <label htmlFor="4"></label>
                                            </div>
                                        </td>
                                        <td className="name">
                                            John
                                        </td>
                                        <td className="name">

                                        </td>
                                        <td className="name">
                                            Smith
                                        </td>
                                        <td className="email">
                                            mark@gmail.com
                                        </td>
                                    </tr>
                                    <tr className="standard-row">
                                        <td className="select">
                                            <div className="row-table-cell valign-middle center grid-checkbox-column">
                                                <input type="checkbox" name="peopleCheck" className="filled-in" id="4" />
                                                <label htmlFor="4"></label>
                                            </div>
                                        </td>
                                        <td className="name">
                                            Mark
                                        </td>
                                        <td className="name">

                                        </td>
                                        <td className="name">
                                            S
                                        </td>
                                        <td className="email">
                                            mark@gmail.com
                                        </td>
                                    </tr>
                                    <tr className="standard-row">
                                        <td className="select">
                                            <div className="row-table-cell valign-middle center grid-checkbox-column">
                                                <input type="checkbox" name="peopleCheck" className="filled-in" id="4" />
                                                <label htmlFor="4"></label>
                                            </div>
                                        </td>
                                        <td className="name">
                                            Clarke
                                        </td>
                                        <td className="name">

                                        </td>
                                        <td className="name">
                                            Mike
                                        </td>
                                        <td className="email">
                                            clarke_mike@gmail.com
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BuildMasterList;
