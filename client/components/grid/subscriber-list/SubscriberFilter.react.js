import React from "react";
import ReactDOM from "react-dom";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";

class SubscriberFilter extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.state = {
      emailfilters: {
        noOfEmployees: {
          start: 130,
          end: 1000
        }, location:[{
          tag: "Delhi"},
          {tag: "San Francisco"
        }], designation:[{
          tag: "CEO"},
          {tag: "CIO"
        }]
      }
    };
  }

  /**
   * Initialize the lean modal and custom scrollbar
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".modal-content").mCustomScrollbar({
      theme:"minimal-dark"
    });


    this.el.find(".email-filter-locations-initial").material_chip({
      data: this.state.emailfilters.location
    });
    this.el.find(".email-filter-designation-initial").material_chip({
      data: this.state.emailfilters.designation
    });

    var slider = this.el.find(".filter-no-of-employees")[0];
    noUiSlider.create(slider, {
     start: ["130", "1000"],
     connect: true,
     tooltips: true,
     step: "1",
     range: {
       "min": "1",
       "max": "1150"
     }
    });
    var self = this;
    slider.noUiSlider.on("update", function( values, handle ){
      var range = parseInt(values[handle]);
      if(handle) {
        self.setState({emailfilters: {
          noOfEmployees: {
            start: self.state.emailfilters.noOfEmployees.start,
            end: range
          }
        }});
      } else {
        self.setState({emailfilters: {
          noOfEmployees: {
            start: range,
            end: self.state.emailfilters.noOfEmployees.end
          }
        }});
      }
    });
  }

  /**
   * Open modal for Add or Edit recipient
   * @param  {Object} SubscriberFilter - The list fields who is to be edit
   */
  openModal = (SubscriberFilter) => {
    this.el.openModal({
      dismissible: false
    });
  }

  /**
   * Send state to validator
   * @return {object} this.state The state object
   */
  getValidatorData() {
    return this.state;
  }

  /**
   * Call to close field modal and person modal
   */
  closeModal = () => {
    this.el.closeModal({
    });
  }

  closeFilters = (filterType) => {
    console.log("---");
    this.el.find("."+filterType).remove();
  }

  /**
   * @return {ReactElement} - Modal popup for Add/Edit recipient
   */
  render() {
    return (
      <div id="subscriberfilter" className="modal modal-fixed-header
      modal-fixed-footer">
        <div className="modal-header">
          <div className="head">
            {/* Filter Header */}
            <div className="col sub-nav email-filter">
              <span>Choose Filters</span>
              <a
        className="btn s12 m4 l4 m-4-10 create-email-list-filter cancel-button"
              onClick={this.closeModal}>
          CANCEL</a>
              <a className="btn blue s12 m4 l4 m-4-10 create-email-list-filter">
              SHOW RESULTS</a>
              <a
  className="btn s12 m4 l4 m-4-10 create-email-list-filter outline-red-button">
          12764 leads found</a>
            </div>
            {/*End */}
          </div>
        </div>
        <div className="modal-content">
          {/* Filter Container */}
          <div className="section row">
            <div className="col s12 m4 l4">
              <div className="email-filter-left-pane">
                <div className="card template-preview add-filter">
                  <div className="card-title">ADD FILTERS</div>
                  <div className="p-20">
                    <div className="col s10 m10 l10">Capital Raised</div>
                    <i className="col s2 m20 l2 material-icons fill-blue">
                    add_circle_outline</i>
                  </div>
                  <div className="p-20">
                    <div className="col s10 m10 l10">Industry / Vertical</div>
                    <i className="col s2 m20 l2 material-icons fill-blue">
                    add_circle_outline</i>
                  </div>
                  <div className="p-20">
                    <div className="col s10 m10 l10">Technologies</div>
                    <i className="col s2 m20 l2 material-icons fill-blue">
                    add_circle_outline</i>
                  </div>

                </div>
                <div className="card template-preview premium-filter">
                  <div className="card-title">PREMIUM FILTERS</div>
                  <div className="p-20">
                    <div className="col s10 m10 l10">Premium Filter #1</div>
                    <i className="col s2 m20 l2 material-icons fill-pink">
                    add_circle_outline</i>
                  </div>
                  <div className="p-20">
                    <div className="col s10 m10 l10">Premium Filter #2</div>
                    <i className="col s2 m20 l2 material-icons fill-pink">
                    add_circle_outline</i>
                  </div>
                  <div className="p-20">
                    <div className="col s10 m10 l10">Premium Filter #3</div>
                    <i className="col s2 m20 l2 material-icons fill-pink">
                    add_circle_outline</i>
                  </div>
                </div>
              </div>
            </div>
            {/* Filter values */}
            <div className="col s12 m8 l8 email-list-filter-preview">
              <div>
                <div className="card template-preview location">
                  <div className="card-title">LOCATION
                    <i className="material-icons fill-blue email-filter-close"
                    onClick={() => this.closeFilters("location")}>
                    close</i>
                  </div>
                  <div className="col s12  m-t-15 card-content">
                    <div className="chips email-filter-locations-initial"></div>
                      You can type multiple locations seperated by a comma, such
                       as "San Franciso, New York".
                  </div>
                </div>
                <div className="card template-preview designation">
                  <div className="card-title">DESIGNATIONS
                    <i className="material-icons fill-blue email-filter-close"
                    onClick={() => this.closeFilters("designation")}>
                    close</i>
                  </div>
                  <div className="col s12 card-content">
                    <div className="chips email-filter-designation-initial">
                    </div>
                    You can type multiple designations seperated by a comma,
                    such as "CEO, Product Manager".
                  </div>
                </div>

                <div className="card template-preview noofemployees">
                  <div className="card-title">NUMBER OF EMPLOYEES
                      <i className="material-icons email-filter-close"
                      onClick={() => this.closeFilters("noofemployees")}>
                      close</i>
                  </div>
                  <div className="col s12 card-content">
                    <div className="no-of-employees container">
                      <span>{this.state.emailfilters.noOfEmployees.start}</span>
                        <span>&nbsp; - &nbsp;</span>
                      <span>{this.state.emailfilters.noOfEmployees.end}</span>
                    </div>
                    <div className="filter-no-of-employees m-t-45"></div>
                  </div>
                </div>

              </div>
            </div>

          </div>
          {/*End */}

        </div>
      </div>
    );
  }
}

export default validation(strategy)(SubscriberFilter);
