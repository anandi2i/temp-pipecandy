import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import CampaignApi from "../API/CampaignApi";
import appHistory from "../RouteContainer";

let _error = "";
let _getAllCampaigns = {};

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const CampaignStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitChange() {
    this.emit("change");
  },

  // Add change listener
  addChangeListener(callback) {
    this.on("change", callback);
  },

  // Remove change listener
  removeChangeListener(callback) {
    this.removeListener("change", callback);
  },

  getAllCampaigns() {
    return _getAllCampaigns;
  },

  getError() {
    return _error;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.CREATE_NEW_CAMPAIGN:
      CampaignApi.crateCampaign(action.data).then((response) => {
        _error = "";
        appHistory.push("campaign/run");
      }, (err)=> {
        _error = err;
        CampaignStore.emitChange();
      });
      break;
    case Constants.GET_ALL_CAMPAIGN:
      CampaignApi.getAllCampaign().then((response) => {
        _getAllCampaigns = response.data;
        _error = "";
        CampaignStore.emitChange();
      }, (err)=> {
        _error = err;
        CampaignStore.emitChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default CampaignStore;
