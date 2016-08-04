module.exports = function(RequestAudit) {

  /**
   * Method to create Request Audit
   * @param  {Request}   req
   * @param  {Response}   res
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  RequestAudit.createAudit = (req, res, callback) => {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const zero = 0;
    let requestAudit = {
      clientIp: ip,
      requestPath: req.path,
      isMobile: req.useragent.isMobile,
      clientBrowser: req.useragent.browser,
      requestParams: JSON.stringify(req.params),
      browserVersion: req.useragent.version,
      clientOS: req.useragent.os,
      clientPlatform: req.useragent.platform,
      userId: req.accessToken ? req.accessToken.userId : zero,
      clientSource: req.useragent.source
    };
    RequestAudit.create(requestAudit, (err, requestAuditModel) => {
      if(callback) return callback(null);
      return;
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   * @author Syed Sulaiman M
   */
  RequestAudit.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
