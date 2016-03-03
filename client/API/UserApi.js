import api from "axios";

const UserApi = {
  register(data) {
    return api.post("/api/users", data);
  },

  login(data) {
    return api.post("/api/users/login", data);
  },

  getUserDetail() {
    const cookie = document.cookie;
    const userId =
      cookie.replace(/(?:(?:^|.*;\s*)userId\s*\=\s*([^;]*).*$)|^.*$/, "$1");
    return api.get("/api/users/"+ userId);
  },

  logout() {
    return api.post("/api/users/logout");
  },

  userUpdate(data) {
    return api.put("/api/users/" + data.id, data);
  }
};

export default UserApi;
