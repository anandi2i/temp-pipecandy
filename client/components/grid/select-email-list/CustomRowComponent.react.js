import React from "react";
import {Link} from "react-router";

class CustomGridRowComponent extends React.Component {

  handleCheckboxChange = () => {
    this.props.globalData().toggleSelectRow(
      this.props.data,
      this.refs.selected.checked
    );
  }

  render() {
    const data = this.props.data;
    let checkboxId = guid();
    let checkedStatus = this.props.globalData().getIsRowChecked(data);
    const {id, name, membersCount, createdBy, openPercentage,
      lastRunAt, clickPercentage, spamPercentage, additions} = data;
    return (
      <div className="email-list">
        <div className="row">
          <div className="col m6 s12 block-1">
            <div className="row-table">
              <div className="row-table-cell valign-middle center grid-checkbox-column">
                <input
                  type="checkbox"
                  id={checkboxId}
                  className="filled-in"
                  checked={checkedStatus}
                  onChange={this.handleCheckboxChange}
                  ref="selected" />
                <label htmlFor={checkboxId}></label>
              </div>
              <div className="row-table-cell valign-middle">
                {
                  this.props.globalData().listLink
                    ? <h1><Link to={`/list/${id}`}>{name}</Link></h1>
                    : <h1>{name}</h1>
                }
                <span className="subscriber-count">
                  <i className="mdi mdi-account"></i>
                  &nbsp;{membersCount}
                  <i className="mdi mdi-record circle-dot"></i>
                </span>
                <span className="owner">{createdBy}</span>
              </div>
            </div>
          </div>
          <div className="col m6 s12 block-2">
            <div className="row">
              <div className="col s12">
                <h2>Last Sent: {lastRunAt}</h2>
              </div>
            </div>
            <div className="row campaign-details">
              <div className="col m3 s6">
                <span>{openPercentage}% Opens</span>
              </div>
              <div className="col m3 s6">
                <span>{clickPercentage}% Clicks</span>
              </div>
              <div className="col m3 s6">
                <span>{spamPercentage}% Spam</span>
              </div>
              <div className="col m3 s6">
                <span>{additions} Additions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

CustomGridRowComponent.defaultProps = {
  data: {}
};

export default CustomGridRowComponent;
