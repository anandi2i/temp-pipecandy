import api from 'axios';

const UserApi = {
  register(data) {
    return api.post("/api/users", data);
  },

  login(data) {
    return api.post("/api/users/login", data);
  },

  logout() {
    return api.post("/api/users/logout");
  }
};

export default UserApi;
