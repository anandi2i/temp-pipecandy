import api from "axios";
import cookie from "react-cookie";

const CampaignApi = {
  crateCampaign(data) {
    return api.post("/api/users/"+ cookie.load("userId") +"/campaigns", data);
  },
  getAllCampaign() {
    return api.get("/api/users/"+ cookie.load("userId") +"/campaigns");
  }
};

export default CampaignApi;
