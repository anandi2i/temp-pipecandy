module.exports = function(app) {
  //verified
  app.get("/verified", function(req, res) {
    res.redirect("/#/email-verified");
  });

  /**
   * Set unsigned cookie for userId and redirect to homepage
   */
  app.get("/auth/success", function(req, res) {
    const milliSec = 1000;
    res.cookie("userId", req.accessToken.userId.toString(), {
      signed: !req.signedCookies ? true : false,
      maxAge: milliSec * req.accessToken.ttl
    });
    res.redirect("/#/home");
  });

};
