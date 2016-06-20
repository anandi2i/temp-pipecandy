import _ from "lodash";
import logger from "../../server/log";

module.exports = function(userIdentity) {

  /**
   * Returns users who allows mail box crawl
   * @param  {Function} callback [description]
   */
  userIdentity.getCrawlableUsers = (callback) => {
    let users = [];
    userIdentity.find({
      limit: 1000
    }, (userIdentityErr, userIdentities) => {
      if (userIdentityErr) {
        logger.error(userIdentityErr);
        callback(userIdentityErr);
      }
      _(userIdentities).forEach((userIdentity) => {
        if (userIdentity.isCrawlEnabled) {
          users.push(userIdentity);
        }
      });
      callback(null, users);
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
