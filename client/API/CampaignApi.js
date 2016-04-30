import api from "axios";
import UserStore from "../stores/UserStore";

const CampaignApi = {
  createCampaign(data) {
    return api.post(`/api/users/${UserStore.getUser().id}/campaigns`, data);
  },
  getAllCampaign() {
    return api.get(`/api/users/${UserStore.getUser().id}/campaigns`);
  },
  getAllEmailTemplates() {
    return api.get("api/defaultTemplates");
  }
};

export default CampaignApi;
