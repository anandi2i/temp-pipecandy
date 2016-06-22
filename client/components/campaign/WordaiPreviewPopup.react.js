import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import CampaignStore from "../../stores/CampaignStore";
import CampaignActions from "../../actions/CampaignActions";
import Spinner from "../Spinner.react";

class WordaiPreviewPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contentVariations: []
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    CampaignStore.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    CampaignStore.removeChangeListener(this.onStoreChange);
  }

  onStoreChange = () => {
    let variations = CampaignStore.checkWordIoVariations();
    if(variations){
      //TODO need to clean
      const start = 1, init = 0;
      if(variations.charAt(init) === "{")
        variations = variations.substr(start);
      if(variations.charAt(variations.length-start) === "}")
        variations = variations.substr(init, variations.length-start);
      let variationsList = variations.split("|");
      this.setState({
        contentVariations: variationsList
      });
    }
  }

  openModal = (emailRawText) => {
    this.setState({
      emailContent: emailRawText.replace(/\s+/g, " ").trim(),
      contentVariations: []
    }, () => {
      this.el.openModal({
        dismissible: false
      });
      CampaignActions.checkWordIoVariations({
        "content": this.state.emailContent
      });
    });
    this.el.find(".preview-modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  render() {
    let isVariations =
      (this.state.contentVariations.length ? "none" : "block");
    return (
      <div id="wordaiPreview" className="modal modal-fixed-header modal-fixed-footer lg-modal">
        <i className="mdi mdi-close modal-close"></i>
        <div className="modal-header">
          <div className="head">
            Email Variations
          </div>
        </div>
        <div className="preview-modal-content wordai-preview">
          <div className="col s12">
            <div className="modal-content">
              <div className="template-content">
                <div>
                  <div>
                    <h3>Main content</h3>
                    <div className="col s12 wordai-txt">
                      {this.state.emailContent}
                    </div>
                  </div>
                  <div className="spinner-container" style={{display: isVariations}}>
                    <Spinner />
                  </div>
                  {
                    _.map(this.state.contentVariations, (list, key) => {
                      let count = _.clone(++key);
                      return (
                        <div key={key}>
                          <h3>Email Variation {count}</h3>
                          <div className="col s12 wordai-txt">
                            {list}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default WordaiPreviewPopup;
