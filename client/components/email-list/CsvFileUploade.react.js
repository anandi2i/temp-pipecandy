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
        <div className="alert">
          <div className="col s12">
            <div className="modal-content p-0">
              {
                uploadCsvDetails
                ?
                  uploadCsvDetails.invalidData.length
                    ?
                      <div className="center">
                        <div className="m-b-20">
                          Oops!
                          <strong> {uploadCsvDetails.invalidData.length} </strong>
                          (out of { uploadCsvDetails.dataCount}) records have
                            some missing fields
                          (like first name, last name, email).
                          Would you mind updating them?
                        </div>
                        <a onClick={() => this.errorCsvList()}
                          className="btn btn-dflt blue sm-icon-btn p-1-btn">
                          <i className="left mdi mdi-download"></i>
                          Download problem records
                        </a>
                        <a onClick={this.closeModal}
                          className="btn btn-dflt red sm-icon-btn">
                          Skip
                        </a>
                      </div>
                    :
                      <div className="center">
                        <div className="m-b-20">
                          Success! All the (
                          <strong>{uploadCsvDetails.dataCount}</strong>) records got uploaded.
                          <br/>Turn around & do a fist bump!
                        </div>
                        <a onClick={this.closeModal}
                          className="btn btn-dflt blue sm-icon-btn">
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
