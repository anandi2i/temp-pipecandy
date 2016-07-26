import React from "react";
import PreviewCampaignTemplates from "./PreviewCampaignTemplates.react";

/**
 * Display eye icon and preview campaign template preview popup
 */
class CustomPreviewComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPreview: false
    };
  }
  
  /**
   * After click the eye icon it call the props openmodal function
   * to open preview popup
   */
  handleClick() {
    this.setState({
      isPreview: true
    }, () => {
      this.refs.previewIcon.openModal();
    });
  }

  /**
   * Remove the PreviewCampaignTemplates component after close the modal popup
   */
  closeCallback = () => {
    this.setState({
      isPreview: false
    });
  }

  render() {
    const id = this.props.rowData.id;
    let {isPreview} = this.state;
    return (
      <div>
        <a onClick={() => this.handleClick()}>
          <i className="mdi mdi-eye"></i>
        </a>
        {
          isPreview
            ? <PreviewCampaignTemplates ref="previewIcon" id={id}
                closeCallback={this.closeCallback} />
            : ""
        }
      </div>
    );
  }
}

export default CustomPreviewComponent;
