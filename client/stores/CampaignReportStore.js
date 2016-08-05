import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import CampaignApi from "../API/CampaignApi";

let _error = "";
let _otherCampaignMetrics = {};
let _isExistCampaign = 0;
let emailThread = [];
let openClickRate = {};
let recentCampaignId;

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const CampaignReportStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitOtherStatsChange() {
    this.emit("otherStats");
  },

  // Add change listener
  addOtherStatsChangeListener(callback) {
    this.on("otherStats", callback);
  },

  // Remove change listener
  removeOtherStatsChangeListener(callback) {
    this.removeListener("otherStats", callback);
  },

  // Emit Change event to check Is Exist Campaign
  emitReportViewChange() {
    this.emit("reportView");
  },

  // Add change listener for Is Exist Campaign
  addReportViewChangeListener(callback) {
    this.on("reportView", callback);
  },

  // Remove change listener for Is Exist Campaign
  removeReportViewChangeListener(callback) {
    this.removeListener("reportView", callback);
  },

  // Emit Change event to chek Email Thread
  emitThreadViewChange() {
    this.emit("threadView");
  },

  // Add change listener for Email Thread
  addThreadViewChangeListener(callback) {
    this.on("threadView", callback);
  },

  // Remove change listener for Email Thread
  removeThreadViewChangeListener(callback) {
    this.removeListener("threadView", callback);
  },

  // Emit Change event to chek campaign performance graph
  emitPerformanceGraphChange() {
    this.emit("performanceGraph");
  },

  // Add change listener for campaign performance graph
  addPerformanceGraphListener(callback) {
    this.on("performanceGraph", callback);
  },

  // Remove change listener for campaign performance graph
  removePerformanceGraphListener(callback) {
    this.removeListener("performanceGraph", callback);
  },

  // Get open and click rate
  getOpenClickRate() {
    return openClickRate;
  },

  // Remove open and click rate
  removeOpenClickRate() {
    openClickRate = {};
  },

  // Get other stats metrics data
  getOtherStatsMetrics() {
    return _otherCampaignMetrics;
  },

  // Check is campaign is existing
  getIsExistCampaign() {
    return _isExistCampaign;
  },

  // Remove is campaign is existing
  removeIsExistCampaign() {
    _isExistCampaign = 0;
  },

  // Get email thread's
  getEmailThread() {
    return emailThread;
  },

  getError() {
    return _error;
  },

  /**
   * Return the recent campaign id
   * @return {number} recentCampaignId
   */
  recentCampaignId() {
    return recentCampaignId;
  },

  /**
   * Reset the recent campaignId
   */
  resetRecentCampaignId() {
    recentCampaignId = null;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.GET_OTHER_STATS_METRICS:
      CampaignApi.getOtherCampaignMetrics(action.id).then((response) => {
        _error = "";
        _otherCampaignMetrics = response.data;
        CampaignReportStore.emitOtherStatsChange();
      }, (err) => {
        _error = err.message;
        CampaignReportStore.emitOtherStatsChange();
      });
      break;
    case Constants.HAS_RECENT_CAMPAIGN:
      CampaignApi.hasRecentCampaign().then((response) => {
        _error = "";
        if(response.data.hasCampaign) {
          recentCampaignId = response.data.hasCampaign;
        }
        CampaignReportStore.emitReportViewChange();
      }, (err) => {
        recentCampaignId = null;
        _error = err.message;
        CampaignReportStore.emitReportViewChange();
      });
      break;
    case Constants.GET_IS_EXISTING_CAMPAIGN:
      CampaignApi.getIsExistingCampaign(action.id).then((response) => {
        _error = "";
        _isExistCampaign = response.data.hasCampaign;
        CampaignReportStore.emitReportViewChange();
      }, (err) => {
        _error = err.message;
        CampaignReportStore.emitReportViewChange();
      });
      break;
      case Constants.GET_EMAIL_THREAD:
        CampaignApi.getEmailThread(action.id).then((response) => {
          _error = "";
          emailThread = response.data;
          CampaignReportStore.emitThreadViewChange();
        }, (err) => {
          _error = err.message;
          CampaignReportStore.emitThreadViewChange();
        });
        break;
      case Constants.CAMPAIGN_PERFORMANCE_GRAPH:
        CampaignApi.getCampaignPerformanceGraph(action.campaignId)
          .then((response) => {
            _error = "";
            openClickRate = response.data;
            CampaignReportStore.emitPerformanceGraphChange();
          }, (err) => {
            _error = err.message;
            CampaignReportStore.emitPerformanceGraphChange();
          });
        break;
    default:
      return true;
  }
  return true;
});

export default CampaignReportStore;
