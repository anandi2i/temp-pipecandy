module.exports = function(app) {
  //verified
  app.get("/verified", function(req, res) {
    res.redirect("/#/email-verified");
  });

};
