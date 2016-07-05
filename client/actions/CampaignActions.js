import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

// Define action methods
const CampaignActions = {
  createNewCampaign(campaign) {
    AppDispatcher.handleAction({
      actionType: Constants.CREATE_NEW_CAMPAIGN,
      data: campaign
    });
  },
  getAllCampaigns() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_ALL_CAMPAIGN
    });
  },
  getAllEmailTemplates() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_ALL_EMAIL_TEMPLATES
    });
  },
  getSelectedEmailList(emailListIds) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_SELECTED_EMAIL_LIST,
      data: emailListIds
    });
  },
  getAllInboxReport() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_ALL_INBOX_REPORT
    });
  },
  /**
   * To check campaign id is exists or not
   * @param  {integer} compaignId existing of campaign id
   */
  isExistCampaign(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.CHECK_EXISTING_CAMPAIGN,
      campaignId: campaignId
    });
  },
  /**
   * To get the recent campaignMetrics
   */
  getRecentCampaignMetrics() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_RECENT_CAMPAIGN_METRICS
    });
  },
  /**
   * To get the current campaignMetrics
   */
  getCurrentCampaignMetrics(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_CURRENT_CAMPAIGN_METRICS,
      campaignId: campaignId
    });
  },
  /**
   * Save campaign templates
   * TODO need to save followups also
   */
  saveCampaignTemplates(campaignData) {
    AppDispatcher.handleAction({
      actionType: Constants.SAVE_CAMPAIGN_TEMPLATES,
      campaign: campaignData
    });
  },
  /**
   * Check the spam rate for given string array
   * @param {array} data Array of strings to check spam rate
   */
  checkSpam(data) {
    AppDispatcher.handleAction({
      actionType: Constants.CHECK_SPAM,
      data: data
    });
  },
  /**
   * To get the recent campaignDetails
   */
  getRecentCampaignDetails() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_RECENT_CAMPAIGN_DETAILS,
    });
  },
  /**
   * To get the current campaignDetails
   */
  getCurrentCampaignDetails(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_CURRENT_CAMPAIGN_DETAILS,
      campaignId : campaignId
    });
  },
  /**
   * To get the email content Variations
   */
  checkWordIoVariations(content) {
    AppDispatcher.handleAction({
      actionType: Constants.CHECK_WORDIO_VARIATIONS,
      content : content
    });
  },
  /**
   * To get campaign other stats metrics
   */
  getOtherStatsMetrics(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_OTHER_STATS_METRICS,
      id : campaignId
    });
  },
  /**
   * To get is campaign metrics is available
   */
  getIsExistingCampaign(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_IS_EXISTING_CAMPAIGN,
      id : campaignId
    });
  }
};

export default CampaignActions;
