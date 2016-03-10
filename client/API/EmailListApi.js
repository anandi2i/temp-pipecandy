import api from "axios";
const EmailListApi = {
  findAll() {
    return api.get("/api/lists");
  },
  crateList(data) {
    return api.post("/api/lists", data);
  },
  getList(id){
    return api.get("/api/lists/"+id);
  }
};

export default EmailListApi;
