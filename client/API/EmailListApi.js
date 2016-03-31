import api from "axios";
import cookie from "react-cookie";

const EmailListApi = {
  findAll() {
    return api.get("/api/users/"+ cookie.load("userId") +"/lists");
  },
  crateList(data) {
    return api.post("/api/users/"+ cookie.load("userId") +"/lists", data);
  },
  getList(data) {
    return api.post("api/lists/listPeopleField", data);
  },
  uploadFile(data) {
    return api.post("api/file/upload?listid=" + data.listId, data.fileObj);
  },
  saveSinglePerson(data) {
    return api.post("api/lists/" + data.listId + "/people", data.person);
  }
};

export default EmailListApi;
