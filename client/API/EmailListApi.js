import api from "axios";

const EmailListApi = {
  findAll() {
    return api.get(`/api/users/${getCookie("userId")}/lists`);
  },
  createList(data) {
    return api.post("/api/users/createEmailList", data);
  },
  getSelectedList(data) {
    return api.post("api/lists/listPeopleField", data);
  },
  uploadFile(data) {
    return api.post("api/file/upload?listid=" + data.listId, data.fileObj);
  },
  saveSinglePerson(data) {
    return api.post("api/lists/" + data.listId + "/people", data.person);
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
  }
};

export default EmailListApi;
