import request from "request";
import fs from "fs";
import logger from "../../server/log";
import lodash from "lodash";

module.exports = function(app) {
  //verified
  app.get("/verified", function(req, res) {
    res.redirect("/email-verified");
  });

  /**
   * Set unsigned cookie for userId and redirect to homepage
   * Download user profile picture an update it
   */
  app.get("/auth/success", function(req, res) {
    if(!req.accessToken) {
      logger.error("No accessToken");
      return res.redirect("/signup");
    }
    const milliSec = 1000;
    let redirect = () => {
      res.cookie("userId", req.accessToken.userId.toString(), {
        signed: !req.signedCookies ? true : false,
        maxAge: milliSec * req.accessToken.ttl
      });
      return res.redirect("/");
    };
    app.models.user.findById(
      req.accessToken.userId,
      {include: "identities"},
    (err, user) => {
      if(err) {
        logger.error(`error in fetching user details for the userId::
          ${req.accessToken.userId} err:: ${err}`);
        return res.redirect("/signup");
      }
      let userData = user.toJSON();
      updateUserName(user, userData, (error, user) => {
        if(error) return redirect();
        updateUserImage(user, userData, (error, user) => {
          if(error) return redirect();
          user.updateAttributes(user, (err, result) => {
            if (err) {
              logger.error(`error in updating user avatar userId::
                ${userData.id} err:: ${err}`);
            }
            redirect();
          });
        });
      });
    });
  });

  /**
   * Method to update user first & last name in User Object
   * @param  {Object}   user
   * @param  {Object}   userData
   * @param  {Function} callback
   * @author Syed Sulaiman M
   */
  const updateUserName = (user, userData, callback) => {
    if("google" === userData.identities[0].provider) {
      user.isMailReadEnabled = true;
    }
    if(lodash.isEmpty(user.firstName) && lodash.isEmpty(user.lastName)) {
      let userName = userData.identities[0].profile.name;
      if(!lodash.isEmpty(userName)) {
        user.firstName = userName.givenName;
        user.lastName = userName.familyName;
      }
    }
    return callback(null, user);
  };

  /**
   * Method to update user Image Path in User Object
   * @param  {Object}   user
   * @param  {Object}   userData
   * @param  {Function} callback
   */
  const updateUserImage = (user, userData, callback) => {
    let img;
    if(userData.identities[0].profile.photos.length) {
      img = userData.identities[0].profile.photos[0].value;
    }
    // Check if the avatar is not updated
    // Check if the social profile exist and has not default image
    if (user.avatar === "/images/photo.png" && img &&
      img !== "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI" +
        "/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50"
    ) {
      let imgUrl = img.split("?")[0];
      request.head(imgUrl, function(err, response, body) {
        if(err) {
          logger.error(`error in fetching profile picture userId::
            ${userData.id} err:: ${err}`);
          return callback(err);
        }
        let dir = `./server/storage/${userData.id}`;
        if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
        }
        let avatarPath = `${dir}/photo.png`;
        let stream = request(imgUrl).pipe(fs.createWriteStream(avatarPath));
        stream.on("error", (err) => {
          logger.error(`error in streaming profile picture userId::
            ${userData.id} err:: ${err}`);
          return callback(err);
        });
        stream.on("close", () => {
          let savePath = `/api/containers/${userData.id}/download/photo.png`;
          user.avatar = savePath;
          return callback(null, user);
        });
      });
    } else {
      return callback(null, user);
    }
  };
};
