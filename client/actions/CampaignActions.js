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
  getSelectedEmailList(emailListIds) {
    AppDispatcher.handleAction({
      actionType: Constants.GET_SELECTED_EMAIL_LIST,
      data: emailListIds
    });
  },
  getAllInboxReport() {
    AppDispatcher.handleAction({
      actionType: Constants.GET_ALL_INBOX_REPORT
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
  }
};

export default CampaignActions;
