import React from "react";
import ReactDOM from "react-dom";

function downloadErrorCsvList(invalidData) {
  let invalidList = [];
  let content = [];
  invalidList.push(Object.keys(invalidData[0]));
  invalidData.map((obj, index) => {
    content = [];
    for (var key in obj) {
      content.push(obj[key]);
    }
    invalidList.push(content);
  });
  let csvContent = "data:text/csv;charset=utf-8,";
  let dataString;
  const invalidLength = invalidList.length;
  invalidList.map((infoArray, index) => {
     dataString = infoArray.join(",");
     csvContent += index < invalidLength ? dataString+ "\n" : dataString;
  });
  const encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ErrorEmailList-${new Date().getTime()}.csv`);
  document.body.appendChild(link); // Required for FF
  link.click();
}

class CsvFileUploade extends React.Component {
  constructor(props) {
    /**
     * Initial state values
     * @property {array} emailContent
     */
    super(props);
    this.state = {
      uploadCsvDetails: {
        invalidData: []
      }
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
  }

  /**
   * Open schedule email
   * Init collapsible view
   * Init custom scroolbar
   */
  openModal = () => {
    this.setState({
      uploadCsvDetails: this.props.uploadCsvDetails
    }, () => {
      this.el.openModal({
        dismissible: false
      });
      this.el.find(".preview-modal-content").mCustomScrollbar({
        theme:"minimal-dark"
      });
    });
  }

  /**
   * Close modal popup
   * Call closeCallback to remove this popup in parent container
   */
  closeModal = () => {
    this.el.closeModal();
    this.props.closeCallback();
  }

  errorCsvList = () => {
    downloadErrorCsvList(this.state.uploadCsvDetails.invalidData);
    this.closeModal();
  }

  render() {
    const {uploadCsvDetails} = this.state;
    return (
      <div className="modal min-modal modal-fixed-header">
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="head"></div>
        </div>
        <div className="preview-modal-content">
          <div className="col s12">
            <div className="modal-content m-b-30 m-t-10">
              {
                uploadCsvDetails
                ?
                  uploadCsvDetails.invalidData.length
                    ?
                      <div className="center">
                        Oops!
                        <strong>{uploadCsvDetails.invalidData.length}</strong>
                        (out of 500) records have some missing fields
                        (like first name, last name, email).
                        Would you mind updating them?
                        <br/><br/>
                        <a onClick={() => this.errorCsvList()}
                          className="btn btn-dflt blue sm-icon-btn p-1-btn">
                          <i className="left mdi mdi-download"></i>
                          Download problem records
                        </a>
                        <a onClick={this.closeModal}
                          className="btn btn-dflt red sm-icon-btn p-1-btn">
                          Skip
                        </a>
                      </div>
                    :
                      <div className="center">
                        Success! All the (number) records got uploaded.
                        Turn around & do a fist bump!
                        <br/><br/>
                        <a onClick={this.closeModal}
                          className="btn btn-dflt blue sm-icon-btn p-1-btn">
                          Ok
                        </a>
                      </div>
                : ""
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CsvFileUploade;
