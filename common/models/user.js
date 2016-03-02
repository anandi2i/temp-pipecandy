import path from "path";
import logger from "../../server/log";
import publicEmailProviders from "../../server/utils/public-email-providers";
import _ from "underscore";

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

  /**
   * Check if the given email id exists under public email providers
   * Executes before creating a user
   */
  user.beforeRemote("create", function(context, data, next) {
    let domainName = context.req.body.email.split("@")[1];
    if(_.contains(publicEmailProviders, domainName)) {
      next(new Error("Not a valid corporate email address"));
    }
    return next();
  });

  user.afterRemote("create", function(context, user, next) {
    var options = {
      type: "email",
      to: user.email,
      from: "pipecandi@gmail.com",
      subject: "Thanks for registering with Pipecandy.",
      template: path.resolve(__dirname, "../../server/views/verify.ejs"),
      redirect: "/verified",
      user: user
    };

    user.verify(options, function(err, response, next) {
      if (err) {
        logger.error("Error to sending email", user.email);
      }
      logger.info("Verify email send to", response);
      context.res.end('{"success" : "Signed up successfully", "status" : 200}');
    });
  });

  user.afterRemote("logout", function(context, result, next) {
    let res = context.res;
    res.clearCookie("access_token");
    res.clearCookie("userId");
    return next();
  });

};
