import request from "request";
import fs from "fs";
import logger from "../../server/log";

module.exports = function(app) {
  //verified
  app.get("/verified", function(req, res) {
    res.redirect("/#/email-verified");
  });

  /**
   * Set unsigned cookie for userId and redirect to homepage
   * Download user profile picture an update it
   */
  app.get("/auth/success", function(req, res) {
    if(!req.accessToken) {
      logger.error("No accessToken");
      return res.redirect("/#/register");
    }
    const milliSec = 1000;
    let redirect = () => {
      res.cookie("userId", req.accessToken.userId.toString(), {
        signed: !req.signedCookies ? true : false,
        maxAge: milliSec * req.accessToken.ttl
      });
      return res.redirect("/#/home");
    };
    app.models.user.findById(
      req.accessToken.userId,
      {include: "identities"},
    (err, user) => {
      if(err) {
        logger.error(`error in fetching user details for the userId::
          ${req.accessToken.userId} err:: ${err}`);
        return res.redirect("/#/register");
      }
      let userData = user.toJSON();
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
            redirect();
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
            redirect();
          });
          stream.on("close", () => {
            let savePath = `/api/containers/${userData.id}/download/photo.png`;
            user.updateAttribute("avatar", savePath, function(err, resl) {
              if (err) {
                logger.error(`error in updating user avatar userId::
                  ${userData.id} err:: ${err}`);
              }
              redirect();
            });
          });
        });
      } else {
        redirect();
      }
    });
  });

};
