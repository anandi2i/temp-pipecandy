import React from "react";
import ReactDOM from "react-dom";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import EmailListActions from "../../../actions/EmailListActions";
import {ThirdPartyHandler} from "../../../utils/ThirdPartyHandler";
import SearchFilterComponent from "./email-filter-list/SearchFilterComponent";
import MultiSelectComponent from "./email-filter-list/MultiSelectComponent";


class SubscriberFilter extends React.Component {
  /**
   * Constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    /*
     * noOfEmployees & location - Initial values
     */
    this.state = {
      emailfilters: {
        noOfEmployees: {
          start: 1,
          end: 1150
        }, location:[{
          tag: "Delhi"},
          {tag: "San Francisco"
        }], designation:[{
          tag: "CEO"},
          {tag: "CIO"
        }]
      },
      location: {
        name: "LOCATION",
        content: "You can type multiple"+
        "locations seperated by a comma,"+
        "such as 'San Franciso, New York'."
      },
      designation: {
        name: "DESIGNATIONS",
        content:"You can type multiple"+
        "designations seperated by a"+
        "comma,such as 'CEO, Product Manager'."
      },
      fundStatus: {
        name: "FUNDING STATUS",
        content: "Please select appropriate funding status(es) for the company"
        +"you're searching for.",
        list : [
          {name: "Seed"},
          {name: "Series A"},
          {name: "Series B"},
          {name: "Series C"},
          {name: "Acquired"}
        ]
      }
    };
  }

  /**
   * Initialize the lean modal and custom scrollbar and other third party
   */
  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.initThirdPartyHandler(this.el);
  }

  /**
   * To intitalize slim scroll and other thrid party plugins
   * @param  {Object} el - Current mounted DOM
   */
  initThirdPartyHandler = (el) => {
    ThirdPartyHandler.intitalize_slim_scroll(el, ".modal-content");
    ThirdPartyHandler.intialize_material_chip(el,
      ".email-filter-locations-initial", this.state.emailfilters.location);
    ThirdPartyHandler.intialize_material_chip(el,
      ".email-filter-designation-initial", this.state.emailfilters.designation);

    let sliderProp = {
      start: ["1", "1150"],
      connect: true,
      tooltips: true,
      step: 1,
      range: {
        "min": 1,
        "max": 1150
      }
    };
    ThirdPartyHandler.intialize_material_ui_slier(el,
      ".filter-no-of-employees", sliderProp);
    ThirdPartyHandler.triggerUpdateEvent_ui_slider(el,
      ".filter-no-of-employees", this.sliderUpdateCB);
  }

  /**
   * Callback to handle and update range slider
   * @param  {String} value - The range value 130 to 1150
   * @param  {String} handle - 0 or 1 - The left or right slider
   */
  sliderUpdateCB = (values, handle) => {
    var range = parseInt(values[handle]);
    if(handle) {
      this.setState({emailfilters: {
        noOfEmployees: {
          start: this.state.emailfilters.noOfEmployees.start,
          end: range
        }
      }});
    } else {
      this.setState({emailfilters: {
        noOfEmployees: {
          start: range,
          end: this.state.emailfilters.noOfEmployees.end
        }
      }});
    }
  };

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
    this.el.find("."+filterType).remove();
  }

  getFilterResults = () => {
    let data = {
      listId: this.props.listId,
      filter: this.state
    };
    EmailListActions.getEmailListByFilter(data);
    this.closeModal();
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
              <a className="btn blue s12 m4 l4 m-4-10 create-email-list-filter"
              onClick={this.getFilterResults}>
              SHOW RESULTS</a>
            </div>
            {/*End */}
          </div>
        </div>
        <div className="modal-content">
          {/* Filter Container */}
          <div className="section row">
            <div className="col s12 m12 l4">
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
            <div className="col s12 m12 l8 email-list-filter-preview">
              <div>

                <SearchFilterComponent listId={this.props.listId}
                data={this.state.location}/>
                <SearchFilterComponent listId={this.props.listId}
                data={this.state.designation}/>


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

                <MultiSelectComponent listId={this.props.listId}
                data={this.state.fundStatus}/>


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
