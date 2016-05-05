import path from "path";
import fs from "fs";
import _ from "underscore";
import loopback from "loopback";
import logger from "../../server/log";
import publicEmailProviders from "../../server/utils/public-email-providers";
import config from "../../server/config.json";

module.exports = function(user) {
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
          signed: !req.signedCookies ? true : false,
          maxAge: milliSec * accessToken.ttl
        });
      }
    }
    //console.log(res.cookie("userId").userId);
    user.findById(accessToken.userId, function(err, instance) {
      accessToken.userData = instance;
      return next();
    });
  });

  /**
   * Check if the given email id exists under public email providers
   * Executes before creating a user
   */
  user.beforeRemote("create", function(context, data, next) {
    let domainName = context.req.body.email.split("@")[1];
    if (_.contains(publicEmailProviders, domainName)) {
      let error = new Error();
      error.message = "Not a valid corporate email address";
      error.name = "InvalidCorporateEmail";
      next(error);
    }
    return next();
  });

  user.afterRemote("create", function(context, user, next) {
    const emailTemplate = "../../server/views/email-templates/verify.ejs";
    var options = {
      type: "email",
      to: user.email,
      from: "pipecandy@gmail.com",
      subject: "Thanks for registering with Pipecandy!",
      template: path.resolve(__dirname, emailTemplate),
      redirect: "/verified",
      user: user,
      fname: user.firstName,
      text: "{href}",
      host: config.emailHost
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

  user.beforeRemote("prototype.updateAttributes",
    function(context, result, next) {
    //TODO code cleanup
    let req = context.req;
    let userID = req.params.id;
    let isCroppedImg = req.body.croppedImg.includes("data:image/png;base64,");
    let isPassword = false;
    if (req.body.oldPassword && req.body.newPassword) {
      isPassword = true;
    }
    if (isCroppedImg || isPassword){
      user.findById(userID, function(err, getUser) {
        if (err) {
          logger.error("error in getting userId %d", userID);
          let error = new Error();
          error.message = "Error in getting user";
          error.name = "ErrorInGettingUser";
          next(error);
        }
        if(isCroppedImg){
          let dir = "./server/storage/" + userID;
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }
          let base64Data = req.body.croppedImg
            .replace(/^data:image\/png;base64,/, "");
          let avatarPath = dir + "/photo.png";
          fs.writeFile(avatarPath, base64Data, "base64", function(err) {
            let savePath = "/api/containers/" + userID + "/download/photo.png";
            getUser.updateAttribute("avatar", savePath, function(err, resl) {
              if (err) {
                logger.error("error in update user avatar userId %d", userID);
                let error = new Error();
                error.message = "Error in update avatar";
                error.name = "ErrorInUpdateAvatar";
                next(error);
              }
              logger.info("userId %d avatar changed successfully", userID);
              next();
            });
          });
        }
        if(isPassword){
          getUser.hasPassword(req.body.oldPassword, function(err, isMatch) {
            if (err) {
              logger.error("error in update password");
              let error = new Error();
              error.message = "Error in update password";
              error.name = "ErrorInUpdatePass";
              next(error);
            } else if (isMatch) {
              getUser.updateAttribute("password", req.body.newPassword,
                function(err, resl) {
                  if (err) {
                    logger.error("error in update password");
                    let error = new Error();
                    error.message = "Error in update password";
                    error.name = "ErrorInUpdatePass";
                    next(error);
                  }
                  logger.info("userId %d password changed successfully",
                    req.body.id);
                  next();
              });
            } else {
              logger.error("The password is invalid for userId %d",
                req.body.id);
              let error = new Error();
              error.message = "Enter valid password";
              error.name = "InvalidPassChange";
              next(error);
            }
          });
        }
      });
    } else {
      logger.error("error in update attributes");
      let error = new Error();
      error.message = "Error in update attributes";
      error.name = "ErrorInUpdatingAttributes";
      next(error);
    }
  });

  //send password reset link when password reset requested
  user.on("resetPasswordRequest", function(info) {
    var url = "http://" + config.emailHost + ":" + config.port + "/#/reset-password";
    var html = "Click <a href='" + url + "/" +
      info.accessToken.id + "'>here</a> to reset your password";
    user.app.models.Email.send({
      to: info.email,
      from: info.email,
      subject: "Password reset",
      html: html
    }, function(err) {
      if (err) {
        logger.error("error in sending password reset email for the user::",
          info.email, " ::err::", err);
        let error = new Error();
        error.message = "Error in sending password reset email";
        error.name = "ErrorInSendingEmailRest";
        next(error);
      }
      logger.info("sending password reset email to:", info.email);
    });
  });

  user.beforeRemote("resetPasswordUsingToken", function(context, result, next) {
    let req = context.req;
    if(req.accessToken) {
      req.body.userId = req.accessToken.userId;
    } else {
      let error = new Error();
      error.message = "Unauthorized access";
      error.name = "InvalidUser";
      next(error);
    }
    next();
  });

  /**
   * Reset user's password if short-lived token is present
   *
   * @param {object} options The plain text password & Access token
   * @returns {Boolean}
   */
  user.resetPasswordUsingToken = function(options, cb) {
    user.findById(options.userId, function(err, instance) {
      if (err) {
        return cb(err);
      }
      instance.updateAttribute("password", options.password,
        function(err, user) {
        if (err) {
          return cb(err);
        }
        cb(null, true);
        return cb.promise;
      });
    });
  };

  user.remoteMethod(
    "resetPasswordUsingToken",
    {
      description: "Reset password for a user with short-lived access token.",
      accepts: [
        {arg: "options", type: "object", required: true, http: {source: "body"}}
      ],
      http: {verb: "post", path: "/reset-password"}
    }
  );

  /**
   * Get the list owner name and add it to the result of each list.
   * Executes after getting the whole list.
   */
  user.afterRemote("prototype.__get__lists", function(ctx, results, next) {
    let ctxResult = ctx.result;
    let userIds = _.pluck(ctxResult, "createdBy");
    user.find({
      where: {id: {inq: userIds}}
    }, (err, users) => {
      if (err) {
        logger.error("Error in getting owner names for list"
          , userIds);
        next(err);
      }
      let ownerObj = _.object(
        _.pluck(users, "id"),
        _.pluck(users, "firstName")
      );
      if (_.isEmpty(ownerObj)) {
        logger.error("Error in getting owner Obj for list"
          , ownerObj);
        next(err);
      } else {
        _.each(ctx.result, (result) => {
          result.owner = ownerObj[result.createdBy];
        });
        next();
      }
    });
  });

  /**
   * Get the current authenticated user details
   * @callback {Function} cb The callback function
   * @returns {Object} The currently authenticated user object
   */
  user.current = function(cb) {
    let ctx = loopback.getCurrentContext();
    if (ctx) {
      cb(null, ctx.get("currentUser"));
    } else {
      cb(null, null);
    }
    return cb.promise;
  };

  user.remoteMethod(
    "current",
    {
      http: {path: "/current", verb: "get"},
      description: "Returns the currently authenticated user",
      returns: {arg: "current", type: "object", root: true}
    }
  );

};
