module.exports = function(user){
  const milliSec = 1000;
  user.afterRemote("login", function(context, accessToken, next) {
    let res = context.res;
    let req = context.req;
    if (accessToken !== null) {
      if (accessToken.id !== null) {
        res.cookie("access_token", accessToken.id, {
          signed: req.signedCookies ? true : false,
          maxAge: milliSec * accessToken.ttl
        });
        res.cookie("userId", accessToken.userId.toString(), {
          signed: req.signedCookies ? true : false,
          maxAge: milliSec * accessToken.ttl
        });
      }
    }
    return next();
  });

  user.afterRemote("create", function(context, userData, next) {
    let res = context.res;
    let req = context.req;
    user.login({
      email: req.body.email,
      password: req.body.password
    }, "user", function (err, accessToken) {
      if (err) {
        logger.error("Problem in creating access token", err.message);
        return res.redirect("back");
      }
      if (accessToken !== null) {
        if (accessToken.id !== null) {
          res.cookie("access_token", accessToken.id, {
            signed: req.signedCookies ? true : false,
            maxAge: milliSec * accessToken.ttl
          });
          res.cookie("userId", accessToken.userId.toString(), {
            signed: req.signedCookies ? true : false,
            maxAge: milliSec * accessToken.ttl
          });
        }
      }
      return next();
    });
  });

  user.afterRemote("logout", function(context, result, next) {
    let res = context.res;
    res.clearCookie("access_token");
    res.clearCookie("userId");
    return next();
  });

};
