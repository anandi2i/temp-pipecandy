import api from "axios";

const CampaignApi = {
  createCampaign(data) {
    return api.post("/api/users/createCampaign", data);
  },
  getAllCampaign() {
    return api.get(`/api/users/${getCookie("userId")}/campaigns`);
  },
  getAllEmailTemplates() {
    return api.get("api/defaultTemplates");
  },
  /**
   * To check campaign id is exists or not
   * @param  {integer} compaignId existing of campaign id
   * @return {boolean}  true or false
   */
  getCampaign(compaignId) {
    return api.get(`api/campaigns/${compaignId}/exists`);
  },
  /**
   * Get the campaign metrics for the current campaign
   * @param  {[campaignId]} campaignId
   */
  getCurrentCampaignMetrics(campaignId) {
    return api.get(`api/campaigns/getCurrentCampaignMetrics/${campaignId}`);
  },
  /**
   * Get recent campaign metrics
   */
  getRecentCampaignMetrics() {
    return api.get("api/campaigns/getRecentCampaignMetrics");
  },
  /**
   * Save campaign templates
   */
  saveCampaignTemplates(campaign) {
    return api.post(`api/campaigns/${campaign.id}/saveCampaignElements`,
      campaign.templates);
  },
  /**
   * Get the spam score for given array
   * @param {array} data template content
   */
  checkSpam(data) {
    return api.post("api/campaignTemplates/checkSpam", data);
  },
  /**
   * Get recent campaign details
   */
  getRecentCampaignDetails() {
    return api.get("api/campaigns/getRecentCampaignDetails");
  },
  /**
   * Get current campaign details
   * @param  {[campaignId]} campaignId
   */
  getCurrentCampaignDetails(campaignId) {
    return api.get(`api/campaigns/getCurrentCampaignDetails/${campaignId}`);
  },
  /**
   * Get email content variations from wordAi
   * @param  {object} email content
   */
  getWordIoVariations(content) {
    return api.post("api/campaignTemplates/wordAI", content);
  },
  /**
   * Get other campaignMetrics details
   * @param  {number|boolean} campaignId - check if campaign id
   * @return {object}                    - campaignMetrics
   */
  getOtherCampaignMetrics(campaignId) {
    let campaignReportURL;
    if(campaignId){
      campaignReportURL = `api/campaigns/${campaignId}/campaignReport`;
    } else {
      campaignReportURL = "api/campaigns/recentCampaignReport";
    }
    return api.get(campaignReportURL);
  },
  /**
   * Get is campaignMetrics is available
   * @param  {number|boolean} campaignId - check if campaign id
   * @return {boolean}                   - is available
   */
  getIsExistingCampaign(campaignId) {
    let campaignReportURL;
    if(campaignId){
      campaignReportURL = `api/campaigns/${campaignId}/exists`;
    } else {
      //TODO need to change API
      campaignReportURL = `api/campaigns/${campaignId}/exists`;
    }
    return api.get(campaignReportURL);
  }
};

export default CampaignApi;
