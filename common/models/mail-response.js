import lodash from "lodash";

module.exports = function(MailResponse) {

  /**
   * Method to create mail response entry
   * @param  {Object}   mailResponse contains properties for mail response table
   * @param  {Function} callback     callback function
   */
  MailResponse.createResponse = (mailResponse, callback) => {
    MailResponse.find({
      where: {
        "mailId": mailResponse.mailId
      }
    }, (mailResponseEntryErr, mailResponseEntry) => {
      if (!lodash.isEmpty(mailResponseEntry)) {
        lodash(mailResponseEntry).forEach(mailResponse => {
          MailResponse.destroyById(mailResponse.id);
        });
      }
      MailResponse.create(mailResponse, (error, response) => {
        callback(error, response);
      });
    });
  };

  /**
   * Method to get latest mail
   * @param  {Integer}   userId
   * @param  {String}   mailId
   * @param  {Function} callback
   */
  MailResponse.getLatestResponse = (userId, mailId, callback) => {
    MailResponse.findOne({
      where: {
        "userId": userId
      },
      order: "receivedDate desc"
    }, (mailResponseEntryErr, mailResponseEntry) => {
      callback(mailResponseEntry);
    });
  };

  /**
   * update nlp class for mail
   * @param  {Object}   mailResponse
   * @param  {Function} callback
   */
  MailResponse.updateMailClass = (mailResponse, callback) => {
    MailResponse.findById(mailResponse.id, (err, result) => {
      result.updateAttribute("NLPClass", mailResponse.NLPClass,
          (updateErr, updatedData) => {
        return callback(updateErr, updatedData);
      });
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  MailResponse.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

};
