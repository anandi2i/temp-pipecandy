import _ from "lodash";
import logger from "../../server/log";

module.exports = function(userIdentity) {

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

};
