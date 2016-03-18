import React from "react";
// import {Link} from "react-router";
// import autobind from "autobind-decorator";
// import CampaignActions from "../../actions/CampaignActions";
// import CampaignStore from "../../stores/CampaignStore";

class ScheduleEmail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 3
    };
  }

  componentDidMount() {
    initTinyMCE("#emailContent", "#mytoolbar");
  }

  render() {
    let isDisplay = (this.props.active === this.state.index ? "block" : "none");
    return (
      <div className="container" style={{display: isDisplay}}>
        <div className="row sub-head-container m-lr-0">
          <div className="head">Let's Draft an Email</div>
          <div className="sub-head">
            <a href="#!" className="btn blue">Save & continue</a>
          </div>
        </div>
        {/* Draft Email starts here*/}
        <div className="row m-t-50">
          <div className="col s12 m12 l8 offset-l2 draft-template">
              <div className="row separator email-to">
                <div className="left-part">
                  To
                </div>
                <div className="right-part">
                  <div className="chip">
                    SoCal Conference Attendees (1234)
                    <i className="material-icons">close</i>
                  </div>
                  <div className="chip">
                    New Customers from Roadshow (33421)
                    <i className="material-icons">close</i>
                  </div>
                  <div className="chip">
                    CIOs Roundtable from HealthCon (891)
                    <i className="material-icons">close</i>
                  </div>
                </div>
              </div>
              <div className="row separator email-subject">
                <div className="left-part">
                  Sub
                </div>
                <div className="right-part">
                  <input id="subject" type="text" placeholder="your subject ..." />
                </div>
              </div>
              <div className="row separator email-subject">
                <div className="left-part">
                  &nbsp;
                </div>
                <div className="right-part">
                  <div className="tiny-toolbar" id="mytoolbar"></div>
                  <div id="emailContent" className="email-body">Click here to edit!</div>
                </div>
              </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ScheduleEmail;
