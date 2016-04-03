import api from "axios";
import cookie from "react-cookie";

const CampaignApi = {
  createCampaign(data) {
    return api.post("/api/users/"+ cookie.load("userId") +"/campaigns", data);
  },
  getAllCampaign() {
    return api.get("/api/users/"+ cookie.load("userId") +"/campaigns");
  },
  getAllEmailTemplates() {
    return api.get("api/emailTemplates");
  }
};

export default CampaignApi;
