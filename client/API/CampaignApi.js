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
  }
};

export default CampaignApi;
