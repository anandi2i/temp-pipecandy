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
  /**
   * Get all templates created by user.
   */
  getAllUserTemplates() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_ALL_USER_TEMPLATES
    });
  },
  getSelectedEmailList(emailListIds) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_SELECTED_EMAIL_LIST,
      data: emailListIds
    });
  },
  /**
   * To get all the email list used for the current campaign Id
   * and the number of persons in each list
   */
  getCampaignEmailList(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_CAMPAIGN_LISTS,
      campaignId: campaignId
    });
  },
  /**
   * Get the inbox mails for a campaign
   * @param  {object} data The data includes campaign id, start, limit
   */
  getInboxMails(data) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_INBOX_MAILS,
      data: data
    });
  },
  /**
   * Get the scheduled mails for a campaign
   * @param  {object} data The data includes campaign id, start, limit
   */
  getScheduledMails(data) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_SCHEDULED_EMAILS,
      data: data
    });
  },
  /**
   * Get the sent mails for a campaign
   * @param  {object} data The data includes campaign id, start, limit
   */
  getSentMails(data) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_SENT_EMAILS,
      data: data
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
   * Save user created templates
   * @param {object} templateData - template name and template content
   */
  saveUserTemplate(templateData) {
    AppDispatcher.handleAction({
      actionType: Constants.SAVE_USER_TEMPLATE,
      templateData: templateData
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
   * Get other campaign stats
   * @param  {number} campaignId
   */
  getCampaignReport(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.CAMPAIGN_REPORT,
      id : campaignId
    });
  },
  /**
   * Check if recent campaign is available
   */
  hasRecentCampaign() {
    AppDispatcher.handleAction({
      actionType: Constants.HAS_RECENT_CAMPAIGN
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
  },
  /**
   * To get is campaign email thread
   */
  getEmailThread(threadId) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_EMAIL_THREAD,
      id : threadId
    });
  },
  /**
   * Move the selected mails to specified classification
   * @return {object} data - The data object includes classification name and
   * selected mail ids.
   */
  moveMails(data) {
    AppDispatcher.handleAction({
      actionType: Constants.MOVE_INBOX_MAILS,
      data: data
    });
  },
  /**
   * Remove the selected persons from queue
   * @param  {Object} peopleIds
   */
  removePeopleQueue(peopleIds) {
    AppDispatcher.handleAction({
      actionType: Constants.REMOVE_PEOPLE_QUEUE,
      peopleIds: peopleIds
    });
  },
  /**
   * Pause the campaign
   * @param {number} campaignId
   */
  pauseCampaign(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.PAUSE_CAMPAIGN,
      campaignId: campaignId
    });
  },
  /**
   * Resume the campaign
   * @param {number} campaignId
   */
  resumeCampaign(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.RESUME_CAMPAIGN,
      campaignId: campaignId
    });
  },
  /**
   * Get campaign performance graph metrics
   * @param  {number} campaignId
   */
  getCampaignPerformanceGraph(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.CAMPAIGN_PERFORMANCE_GRAPH,
      campaignId: campaignId
    });
  },
  /**
   * Get all email link clicks for the campaign
   * @param  {number} campaignId
   */
  getEmailLinkClicks(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.EMAIL_LINK_CLICKS,
      campaignId: campaignId
    });
  },
  /**
   * Get response count of all inbox classifications
   * @param  {number} campaignId
   */
  getInboxClassificationCount(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.INBOX_CLASSIFICATION_COUNT,
      campaignId: campaignId
    });
  },
  /**
   * Send test mail
   * @param  {object} testMailData
   */
  sendTestMail(testMailData) {
    AppDispatcher.handleAction({
      actionType: Constants.SEND_TEST_MAIL,
      data: testMailData
    });
  },
  /**
   * Create new run
   * @param  {number} campaignId
   */
  createNewRun(campaignId) {
    AppDispatcher.handleAction({
      actionType: Constants.CREATE_NEW_RUN,
      campaignId: campaignId
    });
  }
};

export default CampaignActions;
