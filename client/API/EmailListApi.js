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
  }
};

export default EmailListApi;
