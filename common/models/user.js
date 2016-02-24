import path from "path";
import fs from "fs";
import _ from "underscore";
import logger from "../../server/log";
import publicEmailProviders from "../../server/utils/public-email-providers";

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
      from: "pipecandi@gmail.com",
      subject: "Thanks for registering with Pipecandy.",
      template: path.resolve(__dirname, emailTemplate),
      redirect: "/verified",
      user: user,
      fname: user.firstName,
      text: "{href}"
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

  user.beforeRemote("prototype.*", function(context, result, next) {
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
    }
    return next();
  });
};
