import React from "react";
import autobind from "autobind-decorator";
class PreviewCampaignPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      missingTagLen: []
    };
  }

  componentDidMount() {
    $(".multi-modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  @autobind
  replaceMissingSmartTags(tag) {
    let element = document.getElementById("campaignBody");
    let getTemplateString = element.innerText || element.textContent;
    console.log(getTemplateString);
    getTemplateString = getTemplateString.replace(/\s+/g, " ");
    let splitString = getTemplateString
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    let getLength = [];
    let tagContains = -1;
    splitString.forEach(function(val){
      if(val.indexOf("<"+ tag +">") !== tagContains){
        getLength.push(val);
      }
    });
    this.setState({
      missingTagLen: getLength
    });
  }

  @autobind
  closeModal() {
    $("#previewCampaign").closeModal();
  }

  @autobind
  getSmartTagElm(e) {
    this.replaceMissingSmartTags(e.currentTarget.innerHTML);
  }

  render() {
    return (
      <div id="previewCampaign" className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close" onClick={this.closeModal}></i>
        <div className="modal-header">
          <div className="col s6 m6 l6 head">Email preview</div>
          <div className="col s6 m6 l6 head">Tags used</div>
        </div>
        <div className="multi-modal-content">
          <div className="col s12 m6 l6">
            <div className="modal-content">
              <div className="template-content">
                <div className="issue-count">1258 issues found</div>
                <div className="issue-slider">
                  <i className="mdi mdi-chevron-left left"></i>
                  <span className="pagination">
                    Showing <input type="text" /> of 1258
                  </span>
                  <i className="mdi mdi-chevron-right right"></i>
                </div>
                <div className="gray-bg preview-content">
                  <strong>Sub: How are you doing John?</strong>
                  <div id="campaignBody" className="email-body">
                    <p>Hi John,</p>
                    <p>I hope you remember me - we met at E3 held in Tokyo on &lt;meetingDate&gt;.</p>
                    <p>Test content &lt;meetingDate&gt; info</p>
                    <p>Regards, Jack</p>
                    <p>&nbsp;</p>
                    <p>&nbsp;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col s12 m6 l6">
            <div className="modal-content">
              <div className="template-content">
                <div className="smart-tags-container">
                  <span onClick={this.getSmartTagElm}>firstName</span>
                  <span onClick={this.getSmartTagElm}>meetingDate</span>
                </div>
                {
                  this.state.missingTagLen.map($.proxy(function (value, key) {
                    return (
                      <div key={key}>
                        <div className="gray-bg preview-content">
                          <strong>{++key}. Current</strong>
                          <p>{value}</p>
                        </div>
                        <div className="input-field">
                          <textarea id="textarea1" className="materialize-textarea"></textarea>
                          <label htmlFor="textarea1">Replace With</label>
                        </div>
                      </div>
                  );
                  }, this))
                }
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer r-btn-container">
          <input type="button"
            className="btn red modal-action modal-close p-1-btn"
            value="Cancel" />
          <input type="button"
            className="btn blue modal-action" value="Save Changes" />
        </div>
      </div>
    );
  }
}

export default PreviewCampaignPopup;
