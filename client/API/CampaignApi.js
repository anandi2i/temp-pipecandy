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
  }
};

export default CampaignApi;
