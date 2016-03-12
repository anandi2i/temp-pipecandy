import api from "axios";

const UserApi = {
  register(data) {
    return api.post("/api/users", data);
  },

  login(data) {
    return api.post("/api/users/login", data);
  },

  getUserDetail(userId) {
    return api.get("/api/users/"+ userId);
  },

  logout() {
    return api.post("/api/users/logout");
  },

  userUpdate(data) {
    return api.put("/api/users/" + data.id, data);
  },

  forgotPassword(email) {
    return api.post("/api/users/reset", email);
  },

  resetPassword(data) {
    return api.post("/api/users/reset-password?access_token="+
      data.accessToken, {password: data.password});
  }
};

export default UserApi;
