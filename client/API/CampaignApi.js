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
   * Get the campagin metric data
   * Get the campaign matrics for the current campaign
   * @param  {[campaignId]} campaignId
   */
  getCurrentCampaignMetrics(campaignId) {
    return api.get(`api/campaigns/getCurrentCampaignMetrics/${campaignId}`);
  },
  /**
   * Get recent campaign matrics
   */
  getRecentCampaignMetrics() {
    return api.get("api/campaigns/getRecentCampaignMetrics");
  },
  /**
   * Save campaign templates
   */
  saveCampaignTemplates(campaign) {
    return api.post(`api/campaigns/${campaign.id}/saveCampaignTemplate`,
      campaign.templates);
  }
};

export default CampaignApi;
