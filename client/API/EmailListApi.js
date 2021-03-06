import api from "axios";

const EmailListApi = {
  /**
   * Api to get all the cureent user's list with its details
   *
   * @return {object} Promise
   */
  getAllEmailList() {
    return api.get("/api/lists/listMetrics");
  },
  createList(data) {
    return api.post("/api/users/createEmailList", data);
  },
  getSelectedList(data) {
    return api.post("/api/lists/peopleWithFields", data);
  },
  getSelectedListByFilter(data) {
    return api.post("/api/lists/peopleByFilter", data);
  },
  uploadFile(data) {
    return api.post(`/api/file/upload?listid=${data.listId}`, data.fileObj);
  },
  /**
   * Api to save person with additional fields
   *
   * @return {object} Promise
   */
  saveSinglePerson(data) {
    return api.post(`/api/lists/${data.listId}/savePersonWithFields`,
      data.person);
  },
  /**
   * Api to create multiple person in a list
   * @return {object} Promise
   */
  createMultiplePerson(data) {
    return api.post(`/api/lists/${data.listId}/createMultiplePersonWithFields`,
      data);
  },

  /**
   * Update person with additional fields
   *
   * @param  {Object} data - person and field values to be update
   * @return {Object} updated person
   */
  updateSinglePerson(data) {
    return api.put(`/api/lists/${data.listId}/person/${data.person.person.id}` +
      "/updatePersonWithFields", data.person);
  },
  /**
   * Delete list of persons from the email list
   * @param {Object} data Contains list of persons to delete and list of persons emaillist id
   */
  deletePersons(data) {
    return api.post(`/api/lists/removePeople/${data.listId}`, data.peopleIds);
  },
  /**
   * Api to get fields for the list
   *
   * @return {object} Promise
   */
  getFields(data) {
    return api.get(`/api/lists/${data.listId}/fieldswithmeta`);
  },
  /**
   * Api to create field in meta and relate it to list
   *
   * @return {object} Promise
   */
  saveAdditionalField(data) {
    return api.post(`/api/lists/${data.listId}/createField`, data);
  },
  /**
   * Api to relate meta field to list
   *
   * @return {object} Promise
   */
  relateAdditionalField(data) {
    return api.put(`/api/lists/${data.id}/field/${data.fk}`);
  },
  /**
   * Api to get campaign templates for preview in grid view
   *
   * @return {object} Promise
   */
  getCampaignPreviewTemplate(id) {
    return api.get(`/api/campaigns/${id}/campaignTemplates/preview`);
  }
};

export default EmailListApi;
