import api from "axios";

/**
 * Contains a list of api calls made to the server
 */
const UserApi = {
  /**
   * Performs api call to reigster the user
   *
   * @param {object} data - contains the details of the user to be registered
   * @return {object} promise
   */
  register(data) {
    return api.post("/api/users", data);
  },

  /**
   * Performs api call to login and get user id if userinformation
   * is correct
   *
   * @param {object} data - contains the details of the user to be registered
   * @return {object} promise
   */
  login(data) {
    return api.post("/api/users/login", data);
  },

  /**
   * Performs api call get user details
   *
   * @param {object} userId - contains the user id
   * @return {object} promise
   */
  getUserDetail() {
    return api.get("/api/users/current");
  },

  /**
   * Performs api call to logout the currently logged in user
   *
   * @return {object} promise
   */
  logout() {
    return api.post("/api/users/logout");
  },

  /**
   * Performs api call to update user details
   *
   * @param {object} data - contains the user id and user data
   * @return {object} promise
   */
  userUpdate(data) {
    return api.put(`/api/users/${data.id}`, data);
  },

  /**
   * Performs api call to check if email is present in the database
   * so that notification can be sent
   *
   * @param {string} email - contains the email of the user
   * @return {object} promise
   */
  forgotPassword(email) {
    return api.post("/api/users/reset", email);
  },

  /**
   * Performs api call to update the database with new password
   *
   * @param {object} data - contains the access token and new password
   * @return {object} promise
   */
  resetPassword(data) {
    return api.post(`/api/users/reset-password?access_token=
      ${data.accessToken}`, {password: data.password});
  },

  /**
   * Performs api call to unsubscribe campaign user
   *
   * @param {object} data - contains the campaign user details
   * @return {object} promise
   */
  unsubscribe(data) {
    return api.get("/api/people/" + data.people + "/user/" + data.user +
      "/campaign/" + data.campaign + "/unsubscribe");
  }
};

export default UserApi;
