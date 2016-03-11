import api from "axios";
import cookie from "react-cookie";

const EmailListApi = {
  findAll() {
    return api.get("/api/users/"+ cookie.load("userId") +"/lists");
  },
  crateList(data) {
    return api.post("/api/lists", data);
  },
  getList(id){
    return api.get("/api/lists/"+id);
  }
};

export default EmailListApi;
