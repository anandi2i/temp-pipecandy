import path from "path";
import fs from "fs";
import _ from "underscore";
import loopback from "loopback";
import async from "async";
import lodash from "lodash";
import logger from "../../server/log";
import publicEmailProviders from "../../server/utils/public-email-providers";
import validator from "../../server/utils/validatorUtility";
import constants from "../../server/utils/constants";
import config from "../../server/config.json";

const emptyCount = 0;
const percent = 100;
module.exports = function(user) {
  const milliSec = 1000;

  /**
   * Returns users who allows mail box to reas
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  user.getUsersToReadMail = (callback) => {
    user.find({
      include: {relation: "identity"},
      where: {
        and: [
          {"isMailReadEnabled": true},
          {"isMailReaded": false}
        ]
      },
      limit: 100
    }, (usersErr, users) => {
      if (usersErr) {
        logger.error("Error while getting Users ", usersErr);
        return callback(usersErr);
      }
      return callback(null, users);
    });
  };

  /**
   * Update User to set isMailReaded flag to false
   *
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  user.resetMailReadFlag = (callback) => {
    user.updateAll({"isMailReaded": false}, (err, info) => {
      callback(err, info);
    });
  };

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
      host: config.emailHost,
      port: config.emailPort
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
    let isCroppedImg = false;
    let isPassword = false;
    const {croppedImg, oldPassword, newPassword, id} = req.body;
    if(croppedImg) {
      isCroppedImg = croppedImg.includes("data:image/png;base64,");
    }
    if (oldPassword && newPassword) {
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
          let base64Data = croppedImg.replace(/^data:image\/png;base64,/, "");
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
          getUser.hasPassword(oldPassword, function(err, isMatch) {
            if (err) {
              logger.error("error in update password");
              let error = new Error();
              error.message = "Error in update password";
              error.name = "ErrorInUpdatePass";
              next(error);
            } else if (isMatch) {
              if(oldPassword === newPassword) {
                logger.error("Old password and new password are same");
                let error = new Error();
                error.message = "Old password and new password are same";
                error.name = "SamePasswordUpdate";
                next(error);
              }
              getUser.updateAttribute("password", newPassword,
                function(err, resl) {
                  if (err) {
                    logger.error("error in update password");
                    let error = new Error();
                    error.message = "Error in update password";
                    error.name = "ErrorInUpdatePass";
                    next(error);
                  }
                  logger.info("userId %d password changed successfully", id);
                  next();
              });
            } else {
              logger.error("The password is invalid for userId %d", id);
              let error = new Error();
              error.message = "Enter valid password";
              error.name = "InvalidPassChange";
              next(error);
            }
          });
        }
      });
    } else {
      next();
    }
  });

  //send password reset link when password reset requested
  user.on("resetPasswordRequest", function(info) {
    var url = `http://${config.emailHost}:${config.emailPort}/#/reset-password`;
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
   * Reset user"s password if short-lived token is present
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


  user.remoteMethod(
    "current",
    {
      http: {path: "/current", verb: "get"},
      description: "Returns the currently authenticated user",
      returns: {arg: "current", type: "object", root: true}
    }
  );

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

  /**
   * To create a new campaign if and only if is valid and doesnot exist
   * - checked for special characters
   * @param  {[ctx]} ctx
   * @param  {[campaign]} campaign
   * @param  {[function]} createCampaignCB
   * @return {[createdCampaign]}
   * @author Aswin Raj A
   */
  user.createCampaign = function(ctx, campaign, createCampaignCB) {
    async.waterfall([
      async.apply(validateCampaignName, ctx, campaign),
      checkForDuplicateCampaign,
      createNewCampaign
    ], (asyncErr, createdCampaign) => {
      if(asyncErr){
        logger.error(asyncErr);
        return createCampaignCB(asyncErr);
      }
      return createCampaignCB(null, createdCampaign);
    });
  };


  /**
   * Step 1/createCampaign:
   * Validate the campaign name and strip off all the special characters
   * after stripping the special characters if Alphabest exists then campaign
   * will be created with that string, else its invalid name
   * @param  {[ctx]} ctx
   * @param  {[campaign]} campaign
   * @param  {[function]} validateCampaignNameCB
   * @return {[campaignName, ctx]}
   * @author Aswin Raj A
   */
  const validateCampaignName = (ctx, campaign, validateCampaignNameCB) => {
    let campaignName = validator.validateStringWithNumber(campaign.name);
    if (campaignName.length > constants.EMPTYARRAY) {
      return validateCampaignNameCB(null, campaignName, ctx);
    }
    logger.error("Invalid campaign name");
    return validateCampaignNameCB("Invalid campaign name");
  };

  /**
   * Step 2/createCampaign:
   * Check for duplicate campaign name, if not available create it
   * else throw error
   * @param  {[campaignName]} campaignName
   * @param  {[ctx]} ctx
   * @param  {[function]} checkForDuplicateCampaignCB
   * @return {[campaignObj]}
   * @author Aswin Raj A
   */
  const checkForDuplicateCampaign = (campaignName, ctx,
    checkForDuplicateCampaignCB) => {
    const campaignObj = {
      name: campaignName,
      createdBy: ctx.req.accessToken.userId
    };
    user.app.models.Campaign.find({
      where: campaignObj
    }, (campaignFindErr, campaigns) => {
      if(campaignFindErr || !lodash.isEmpty(campaigns)) {
        let errMsg = campaignFindErr || "Campaign already exists!";
        logger.error({
          input : {campaignObj},
          error: errMsg, stack: campaignFindErr ? campaignFindErr.stack : ""
        });
        return checkForDuplicateCampaignCB(errMsg);
      }
      return checkForDuplicateCampaignCB(null, campaignObj);
    });
  };

  /**
   * Step 3/createCampaign:
   * Create a new campaign name with the current object
   * @param  {[campaignObj]} campaignObj
   * @param  {[function]} createNewCampaignCB
   * @return {[createdCampaign]}
   * @author Aswin Raj A
   */
  const createNewCampaign = (campaignObj, createNewCampaignCB) => {
    user.app.models.Campaign.create(campaignObj,
      (campaignCreateErr, createdCampaign) => {
      if(campaignCreateErr){
        logger.error("Error while creating campaign", {
          input : {campaignObj},
          error: campaignCreateErr, stack: campaignCreateErr.stack
        });
        return createNewCampaignCB(campaignCreateErr);
      }
      return createNewCampaignCB(null, createdCampaign);
    });
  };


  /**
   * To create a new list if and only if is valid and doesnot exist
   * - checked for special characters
   * @param  {[ctx]} ctx
   * @param  {[list]} list
   * @param  {[function]} createListCB
   * @return {[createdList]}
   * @author Aswin Raj A
   */
  user.createEmailList = function(ctx, list, createListCB) {
    async.waterfall([
      async.apply(validateEmailListName, ctx, list),
      checkForDuplicateEmailList,
      createNewEmailList
    ], (asyncErr, createdList) => {
      if(asyncErr){
        logger.error(asyncErr);
        return createListCB(asyncErr);
      }
      return createListCB(null, createdList);
    });
  };

  /**
   * Step 1/ createEmailList
   * Validate the email list name and strip off all the special characters
   * after stripping the special characters if Alphabest exists then email list
   * name will be created with that string, else its invalid name
   * @param  {[ctx]} ctx
   * @param  {[list]} list
   * @param  {[function]} validateEmailListNameCB
   * @return {[listName, ctx]}
   * @author Aswin Raj A
   */
  const validateEmailListName = (ctx, list, validateEmailListNameCB) => {
    let listName = validator.validateStringWithNumber(list.name);
    if(listName.length > constants.EMPTYARRAY) {
      return validateEmailListNameCB(null, listName, ctx);
    }
    logger.error("Invalid list name");
    return validateEmailListNameCB("Invalid list name");
  };

  /**
   * Step 2/createEmailList:
   * Check for duplicate email list name, if not available create it
   * else throw error
   * @param  {[listName]} listName
   * @param  {[ctx]} ctx
   * @param  {[function]} checkForDuplicateEmailListCB
   * @return {[listNameObj]}
   * @author Aswin Raj A
   */
  const checkForDuplicateEmailList = (listName, ctx,
    checkForDuplicateEmailListCB) => {
    const listNameObj = {
      name: listName,
      createdBy: ctx.req.accessToken.userId
    };
    user.app.models.list.find({
        where: listNameObj
    }, (listFindErr, lists) => {
      if(listFindErr || !lodash.isEmpty(lists)) {
        let errMsg = listFindErr || "List already exists!";
        logger.error({
          input : {listNameObj},
          error: errMsg, stack: listFindErr ? listFindErr.stack : ""
        });
        return checkForDuplicateEmailListCB(errMsg);
      }
      return checkForDuplicateEmailListCB(null, listNameObj);
    });
  };

  /**
   * Step 3/createEmailList:
   * Create a new email list name for the current object
   * @param  {[listNameObj]} listNameObj
   * @param  {[createNewEmailListCB]} createNewEmailListCB
   * @return {[createdList]}
   * @author Aswin Raj A
   */
  const createNewEmailList =(listNameObj, createNewEmailListCB) => {
    user.app.models.list.create(listNameObj, (listCreateErr, createdList) => {
      if(listCreateErr){
        logger.error("Error while creating list", {
          input : {listNameObj},
          error: listCreateErr, stack: listCreateErr.stack
        });
        return createNewEmailListCB(campaignCreateErr);
      }
      return createNewEmailListCB(null, createdList);
    });
  };

  user.remoteMethod(
    "createCampaign",
    {
      description: "Create unique campaign for user",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "name", type: "object", required: true,
          http: {source: "body"}
        },
      ],
      returns: {arg: "campaign", type: "object", root: true},
      http: {verb: "post"}
    }
  );

  user.remoteMethod(
    "createEmailList",
    {
      description: "Create unique email list for an user",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "name", type: "object", required: true,
          http: {source: "body"}
        },
      ],
      returns: {arg: "list", type: "object", root: true},
      http: {verb: "post"}
    }
  );


  user.remoteMethod(
    "campaignList", {
      description: "Get current campaign details for the current campaign",
      accepts: [{
        arg: "userId",
        type: "number"
      }],
      returns: {
        arg: "campaignsList",
        type: "object"
      },
      http: {
        verb: "get",
        path: "/:userId/campaignList"
      }
    }
  );

  /**
   * API to get the list of campaign for the current user
   * @param  {[userId]} userId
   * @param  {[function]} campaignListCB
   * @return {[campaignsList]}
   * @author Aswin Raj A
   */
  user.campaignList = (userId, campaignListCB) => {
    async.waterfall([
      async.apply(getAllcampaignsForUser, userId),
      generateCampaignMetric
    ], (asyncErr, campaignsList) => {
      if(asyncErr){
        logger.error("", asyncErr);
        campaignListCB(asyncErr);
      }
      campaignListCB(null, campaignsList);
    });
  };

  /**
   * Get all the campaigns created by the current User
   * @param  {[userId]} userId
   * @param  {[function]} getAllcampaignsForUser
   * @return {[campaigns]}
   * @author Aswin Raj A
   */
  const getAllcampaignsForUser = (userId, getAllcampaignsForUser) => {
    user.app.models.campaign.find({
      where : {
        createdBy: userId
      }
    }, (campaignFindErr, campaigns) => {
      if(campaignFindErr || lodash.isEmpty(campaigns)) {
        logger.error("Error while finding campaigns", {
          input : {userId: userId},
          error: campaignFindErr,
          stack: campaignFindErr ? campaignFindErr.stack : ""
        });
        let errParam = campaignFindErr || "No campaign for user";
        getAllcampaignsForUser(errParam);
      }
      getAllcampaignsForUser(null, campaigns);
    });
  };

  /**
   * To generate campaign metric data for each campaign createdBy the user
   * @param  {[campaigns]} campaigns
   * @param  {[function]} generateCB
   * @return {[campaignList]}
   * @author Aswin Raj A
   */
  const generateCampaignMetric = (campaigns, generateCB) => {
    let campaignList = [];
    async.each(campaigns, (campaign, campaignEachCB) => {
      async.parallel({
        listSentTo : getCampaignListCount.bind(null, campaign),
        replies : getCampaignReplyCount.bind(null, campaign),
        progress : getCampaignProgress.bind(null, campaign)
      }, (parallelErr, campaignMetrics) => {
        if(parallelErr){
          logger.error("Error while getting campaign list metrics", {
            input : {campaignId: campaign.id},
            error: parallelErr, stack: parallelErr.stack
          });
          campaignEachCB(parallelErr);
        }
        campaignMetrics.campaignId = campaign.id;
        campaignMetrics.campaign = campaign.name;
        campaignMetrics.statusCode = campaign.statusCode;
        campaignList.push(campaignMetrics);
        campaignEachCB(null);
      });
    }, (eachErr) => {
      if(eachErr){
        logger.error("Error while generating campaign list with metrics", {
          error: eachErr, stack: eachErr.stack});
        generateCB(eachErr);
      }
      generateCB(null, campaignList);
    });
  };

  /**
   * To get the total count of lists attached to the current campaign
   * @param  {[campaign]} campaign
   * @param  {[function]} getCountCB
   * @return {[listCount]}
   * @author Aswin Raj A
   */
  const getCampaignListCount = (campaign, getCountCB) => {
    campaign.lists((listFindErr, lists) => {
      if(listFindErr){
        logger.error("Error while finding list for campaign", {
          input : {campaignId: campaign.id},
          error: listFindErr, stack: listFindErr.stack
        });
        getCountCB(listFindErr);
      }
      getCountCB(null, lists.length);
    });
  };


  /**
   * To get the total count of response for the current campaign
   * @param  {[campaign]} campaign
   * @param  {[function]} getReplyCountCB
   * @return {[responseCount]}
   * @author Aswin Raj A
   */
  const getCampaignReplyCount = (campaign, getReplyCountCB) => {
    if(!campaign.isSent){
      getReplyCountCB(null, emptyCount);
    } else {
      user.app.models.campaignMetric.find({
        where : {
          campaignId : campaign.id
        }
      }, (metricFindErr, campaignMetrics) => {
        if(metricFindErr){
          logger.error("Error while finding campaign metric", {
            input: {campaignId : campaign.id},
            error: metricFindErr, stack: metricFindErr.stack
          });
          getReplyCountCB(metricFindErr);
        }
        getReplyCountCB(null, campaignMetrics[0].responded);
      });
    }
  };

  /**
   * To get the progress rate for the current campaign
   * @param  {[campaign]} campaign
   * @param  {[function]} getProgressCB
   * @return {[progress]}
   * @author Aswin Raj A
   */
  const getCampaignProgress = (campaign, getProgressCB) => {
    if(!campaign.isSent){
      getProgressCB(null, emptyCount);
    } else {
      user.app.models.campaignMetric.find({
        where : {
          campaignId : campaign.id
        }
      }, (metricFindErr, campaignMetrics) => {
        if(metricFindErr){
          logger.error("Error while finding campaign metric", {
            input: {campaignId : campaign.id},
            error: metricFindErr, stack: metricFindErr.stack
          });
          return getProgressCB(metricFindErr);
        }
        let progress = campaignMetrics[0].sent / campaignMetrics[0].assembled;
        progress = Math.round(parseFloat(progress*percent));
        return getProgressCB(null, progress);
      });
    }
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  user.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

};
