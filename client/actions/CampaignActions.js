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
  getAllCampaigns(){
    AppDispatcher.handleAction({
      actionType: Constants.GET_ALL_CAMPAIGN
    });
  }
};

export default CampaignActions;
