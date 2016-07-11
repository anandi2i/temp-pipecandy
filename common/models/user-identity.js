module.exports = function(userIdentity) {

  /**
   * Method to find User Idenity by UserId
   * @param  {Number}   userId
   * @param  {Function} callback
   * @return {userIdentity}
   * @author Syed Sulaiman M
   */
  userIdentity.findByUserId = (userId, callback) => {
    userIdentity.find({
      where: {
        userId: userId
      }
    }, (usercredentialErr, usercredential) => {
      callback(usercredentialErr, usercredential);
    });
  };

  /**
   * Update user credentials
   * @param  {Function} callback [description]
   */
  userIdentity.updateCredentials = (userIdentityInst, callback) => {
    userIdentity.update({
      "id": userIdentityInst.id
    }, {
      credentials: userIdentityInst.credentials
    }, (err, results) => {
      return callback(err, userIdentityInst);
    });
  };

};
