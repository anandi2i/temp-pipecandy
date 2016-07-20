import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import {Link} from "react-router";
import Spinner from "../Spinner.react";

class BuildMasterList extends React.Component {
  constructor(props) {
    console.log("segdrg");
    /**
     * Initial state values
     * @property {array} emailContent
     */
    super(props);
    this.state = {
      isDisplay: false,
      spinner: false,
      emailList: [{
      "firstName": "Travis",
      "middleName": "A",
      "lastName": "Kimmel",
      "email": "travis@gmail.com"
      },
      {
      "firstName": "Eric",
      "middleName": "F",
      "lastName": "Roza",
      "email": "eric_f@gmail.com"
      },
      {
      "firstName": "John",
      "middleName": "",
      "lastName": "Kelley",
      "email": "john@gmail.com"
      },
      {
      "firstName": "Paul",
      "middleName": "H",
      "lastName": "Berberian",
      "email": "paul@gmail.com"
      },
      {
      "firstName": "Ashim",
      "middleName": "",
      "lastName": "Banerjee",
      "email": "ashim@gmail.com"
      },
      {
      "firstName": "Dave",
      "middleName": "",
      "lastName": "Wright",
      "email": "dave@gmail.com"
      },
      {
      "firstName": "Bill",
      "middleName": "",
      "lastName": "Aldrich",
      "email": "bill@gmail.com"
      },
      {
      "firstName": "David",
      "middleName": "J",
      "lastName": "Selina",
      "email": "david@gmail.com"
      },
      {
      "firstName": "Bob",
      "middleName": "",
      "lastName": "Lamvik",
      "email": "bob@gmail.com"
      },
      {
      "firstName": "Alan",
      "middleName": "",
      "lastName": "Sage",
      "email": "alan@gmail.com"
      },
      {
      "firstName": "Mary",
      "middleName": "",
      "lastName": "Beth Loesch",
      "email": "mary@gmail.com"
      },
      {
      "firstName": "Jay",
      "middleName": "",
      "lastName": "Breakstone",
      "email": "jay@gmail.com"
      },
      {
      "firstName": "Matt",
      "middleName": "G",
      "lastName": "Brewer",
      "email": "matt@gmail.com"
      },
      {
      "firstName": "Vijay",
      "middleName": "",
      "lastName": "Bangaru",
      "email": "vijay@gmail.com"
      },
      {
      "firstName": "Shelley",
      "middleName": "",
      "lastName": "Janes",
      "email": "shelley@gmail.com"
      },
      {
      "firstName": "Ethan",
      "middleName": "",
      "lastName": "Holien",
      "email": "ethan@gmail.com"
      },
      {
      "firstName": "Brian",
      "middleName": "",
      "lastName": "Owens",
      "email": "brian@gmail.com"
      },
      {
      "firstName": "Jennie",
      "middleName": "C",
      "lastName": "Hoff",
      "email": "jennie@gmail.com"
      },
      {
      "firstName": "Ben",
      "middleName": "",
      "lastName": "Thompson",
      "email": "ben@gmail.com"
      },
      {
      "firstName": "Jeff",
      "middleName": "I",
      "lastName": "Taggart",
      "email": "jeff@gmail.com"
      }]
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find("select").material_select();
  }

  showResult = () => {
    const timeDelay = 800;
    this.setState({
      isDisplay: false,
      spinner: true
    }, () => {
      setTimeout(() => {
        this.setState({
          spinner: false,
          isDisplay: true
        });
      }, timeDelay);
    });
  }

  render() {
    let {isDisplay, emailList, spinner} = this.state;
    emailList = _.shuffle(emailList);
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
                  <option value="1">United States</option>
                  <option value="2">India</option>
                  <option value="3">United Kingdom</option>
                  <option value="4">Brazil</option>
                  <option value="5">Germany</option>
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
                  <option value="3">Delhi</option>
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
                  <option value="4">Human Resources</option>
                  <option value="5">Staffing and Recruiting</option>
                  <option value="6">Information Technology and Services</option>
                  <option value="7"> Computer Software</option>
                  <option value="8">Internet</option>
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
                  <option value="4">ReactJs</option>
                  <option value="5">AngularJs</option>
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
        <div className="container"
          style={{display: spinner ? "block" : "none"}} >
          <div className="spinner-container">
            <Spinner />
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
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {
                              emailList.map((val, key) => {
                                return(
                                  <tr className="standard-row" key={key}>
                                    <td className="select">
                                      <div className="row-table-cell valign-middle center grid-checkbox-column">
                                        <input type="checkbox" name="peopleCheck" className="filled-in" id="4" />
                                        <label htmlFor="4"></label>
                                      </div>
                                    </td>
                                    <td className="name">
                                      {val.firstName}
                                    </td>
                                    <td className="name">
                                      {val.middleName}
                                    </td>
                                    <td className="name">
                                      {val.lastName}
                                    </td>
                                    <td className="email">
                                      {val.email}
                                    </td>
                                    <td></td>
                                  </tr>
                                );
                              })
                            }
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
