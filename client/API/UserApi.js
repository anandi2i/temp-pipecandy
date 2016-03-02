import api from "axios";

const UserApi = {
  register(data) {
    return api.post("/api/users", data);
  },

  login(data) {
    return api.post("/api/users/login", data);
  },

  getUserDetail() {
    var cookie = document.cookie;
    var userId =
      cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    return api.get("/api/users/"+ userId);
  },

  logout() {
    return api.post("/api/users/logout");
  }
};

export default UserApi;
