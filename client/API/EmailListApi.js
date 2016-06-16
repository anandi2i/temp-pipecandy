import api from "axios";

const EmailListApi = {
  findAll() {
    return api.get(`/api/users/${getCookie("userId")}/lists`);
  },
  createList(data) {
    return api.post("/api/users/createEmailList", data);
  },
  getSelectedList(data) {
    return api.post("api/lists/peopleWithFields", data);
  },
  uploadFile(data) {
    return api.post("api/file/upload?listid=" + data.listId, data.fileObj);
  },
  /**
   * Api to save person with additional fields
   *
   * @return {object} Promise
   */
  saveSinglePerson(data) {
    return api.post(`api/lists/${data.listId}/savePersonWithFields`,
      data.person);
  },
  updateSinglePerson(data) {
    return api.put("api/lists/" + data.listId + "/people/" + data.personId,
      data.person);
  },
  /**
   * Delete list of persons from the email list
   *
   * @param  {Object} data Contains list of persons to delete and list of persons emaillist id
   */
  deletePersons(data) {
    //TODO - call to delete list of persons
    console.log(data);
    return null;
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
    return api.post(`/api/lists/${data.listId}/fields`, data);
  },
  /**
   * Api to relate meta field to list
   *
   * @return {object} Promise
   */
  relateAdditionalField(data) {
    return api.put(`/api/lists/${data.id}/fields/rel/${data.fk}`);
  },
};

export default EmailListApi;
