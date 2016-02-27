import api from 'axios';

const UserApi = {
  login(data) {
    return api.post("/api/users/login", data);
  },

  logout() {
    return api.post("/api/users/logout");
  }
};

export default UserApi;
