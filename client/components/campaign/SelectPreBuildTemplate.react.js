import React from "react";
import autobind from "autobind-decorator";

class SelectPreBuildTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      templates: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      innerTabIndex: 0
    };
  }

  componentDidMount() {
    $(".modal-trigger").leanModal();
  }

  @autobind
  closeModal() {
    $("#previewTemplate").closeModal();
  }

  render() {
    let isDisplay =
      (this.props.active === this.state.innerTabIndex ? "block" : "none");
    return (
      <div className="row" style={{display: isDisplay}}>
        <div className="col s12 m6 l4">
          <div className="card template-preview">
            <div className="card-title">Blank Template</div>
            <div className="card-content">
              &nbsp;
            </div>
            <div className="card-action">
              <i className="mdi mdi-eye-off"></i> Preview
            </div>
          </div>
        </div>
        {
          this.state.templates.map($.proxy(function (value, key) {
            return (
              <div className="col s12 m6 l4" key={key}>
                <div className="card template-preview">
                  <div className="card-title">Template- {key}</div>
                  <div className="card-content">
                    Hi,
                      <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
                  </div>
                  <div className="card-action modal-trigger" href="#previewTemplate">
                    <i className="mdi mdi-eye"></i> Preview
                  </div>
                </div>
              </div>
            );
          }, this))
        }
        {/* Email template preview modal popup starts here*/}
        <div id="previewTemplate" className="modal modal-fixed-header modal-fixed-footer">
          <div className="modal-header">
            <div className="head">Add Subbscriber</div>
            <i className="mdi mdi-close" onClick={this.closeModal}></i>
          </div>
          <div className="modal-content">
            <div className="template-content">
              Hi,
			    <br /><br />You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.<br /><br />As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.<br /><br />How about a quick call sometime tomorrow morning, say 12 pm GMT?<br /><br /><br />
            </div>
          </div>
          <div className="modal-footer r-btn-container">
            <input type="button" className="btn red modal-action modal-close p-1-btn" value="Cancel" />
            <input type="button" className="btn blue modal-action" value="Pick This Template" />
          </div>
        </div>
      </div>
    );
  }
}
export default SelectPreBuildTemplate;
