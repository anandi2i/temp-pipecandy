import api from "axios";
//TODO: api to be added instead of EmailList
var EmailList = [{
  name: "C",
  year: 1972
}, {
  name: "C#",
  year: 2000
}, {
  name: "C++",
  year: 1983
}];
const EmailListApi = {
  find() {
    return EmailList;
  },
  crateList(data) {
    return api.post("/api/lists", data);
  },
  getList(id){
    return api.get("/api/lists/"+id);
  }
};

export default EmailListApi;
