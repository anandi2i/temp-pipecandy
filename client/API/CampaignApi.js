import api from "axios";

const CampaignApi = {
  createCampaign(data) {
    return api.post("/api/users/createCampaign", data);
  },
  getAllCampaign() {
    return api.get(`/api/users/${getCookie("userId")}/campaignList`);
  },
  getAllEmailTemplates() {
    return api.get("/api/defaultTemplates");
  },
  /**
   * To check campaign id is exists or not
   * @param  {integer} compaignId existing of campaign id
   * @return {boolean}  true or false
   */
  getCampaign(compaignId) {
    return api.get(`/api/campaigns/${compaignId}/exists`);
  },
  /**
   * Get the campaign metrics for the current campaign
   * @param  {[campaignId]} campaignId
   */
  getCurrentCampaignMetrics(campaignId) {
    return api.get(`/api/campaigns/getCurrentCampaignMetrics/${campaignId}`);
  },
  /**
   * Save campaign templates
   */
  saveCampaignTemplates(campaign) {
    return api.post(`/api/campaigns/${campaign.id}/saveCampaignElements`,
      campaign.templates);
  },
  /**
   * Get the spam score for given array
   * @param {array} data template content
   */
  checkSpam(data) {
    return api.post("/api/campaignTemplates/checkSpam", data);
  },
  /**
   * Get recent campaign details
   */
  getRecentCampaignDetails() {
    return api.get("/api/campaigns/getRecentCampaignDetails");
  },
  /**
   * Get current campaign details
   * @param  {number} campaignId
   */
  getCurrentCampaignDetails(campaignId) {
    return api.get(`/api/campaigns/getCurrentCampaignDetails/${campaignId}`);
  },
  /**
   * Get email content variations from wordAi
   * @param  {object} email content
   */
  getWordIoVariations(content) {
    return api.post("/api/campaignTemplates/wordAI", content);
  },
  /**
   * Get other campaign stats
   * @param {number} campaignId
   * @return {object} Promise
   */
  getCampaignReport(campaignId) {
    return api.get(`/api/campaigns/${campaignId}/campaignReport`);
  },
  /**
   * Get the recent campaign id
   * @return {object} Promise
   */
  hasRecentCampaign() {
    return api.get("/api/campaigns/hasRecentCampaign");
  },
  /**
   * Get is campaignMetrics is available
   * @param  {number|boolean} campaignId - check if campaign id
   * @return {boolean}                   - is available
   */
  getIsExistingCampaign(campaignId) {
    return api.get(`/api/campaigns/${campaignId}/doesCampaignExist`);
  },
  /**
   * Get inbox mails
   * @param  {object} data - The data includes campaign id, start, limit, classification
   * @return {object} Promise
   */
  getInboxMails(data) {
    const {id, start, limit, classification} = data;
    return api.get(`/api/inboxMails/campaign/${id}/${classification}?` +
      `start=${start}&limit=${limit}`);
  },
  /**
   * Get scheduled mails
   * @param  {object} data - The data includes campaign id, start and end count
   * @return {object} Promise
   */
  getScheduledMails(data) {
    const {id, start, end} = data;
    return api.get(`/api/emailsQueue/scheduledMails/campaign/${id}?` +
      `start=${start}&limit=${end}`);
  },
  /**
   * Get sent mails
   * @param  {object} data - The data includes campaign id, start and end count
   * @return {object} Promise
   */
  getSentMails(data) {
    const {id, start, end} = data;
    return api.get(`/api/sentMailBoxes/sentMails/campaign/${id}?` +
      `start=${start}&limit=${end}`);
  },
  /**
   * Get email thread
   * @param  {object} id - Email thread id to get all emails in that thread
   * @return {object} Promise
   */
  getEmailThread(id) {
    return api.get(`/api/MailResponses/threadId/${id}`);
  },
  /**
   * Move emails to specified classfication
   * @param {object} data - The data object includes classification and inboxIds
   */
  moveMails(data) {
    const {classification, inboxIds} = data;
    return api.put(`/api/inboxMails/${classification}`, inboxIds);
  },
  /**
   * Remove the selected emails from queue
   * @param {object} peopleIds
   */
  removePeopleQueue(peopleIds) {
    return api.post("/api/emailsQueue/people", peopleIds);
  },
  /**
   * Pause the campaign
   * @param {number} campaignId
   * @return {object} Promise
   */
  pauseCampaign(campaignId) {
    return api.put(`/api/campaigns/${campaignId}/stop`);
  },
  /**
   * Resume the campaign
   * @param {number} campaignId
   * @return {object} Promise
   */
  resumeCampaign(campaignId) {
    return api.put(`/api/campaigns/${campaignId}/resume`);
  },
  /**
   * Get open click rate metrics for campaign
   * @param {object} campaignId
   */
  getCampaignPerformanceGraph(campaignId) {
    return api.get(`/api/campaigns/${campaignId}/openClickRate`);
  },
  /**
  * Get email link clicks for campaign
  * @param {object} campaignId
   */
  getEmailLinkClicks(campaignId) {
    return api.get(`/api/clickedEmailLinks/campaign/${campaignId}`);
  },
  /**
   * Get response count of inbox classifications
   * @param  {number} campaignId
   */
  getInboxClassificationCount(campaignId) {
    return api.get(`/api/inboxMails/campaign/${campaignId}/inboxMailsCount`);
  }
};

export default CampaignApi;
