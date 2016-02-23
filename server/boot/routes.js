import React from "react";
import Router from "react-router";
import reactRoutes from "../../client/routes";
import logger from '../log';

module.exports = function routes(app) {

  function createRoute (url){
    return Router.create({
      location: url,
      routes: reactRoutes
    });
  }

  var CoffeeShop = app.models.CoffeeShop;
  var Reviewer = app.models.Reviewer;
  var User = app.models.user;

  app.get('/', function (req, res) {

    logger.info('Welcome to Pipecandy home page');

    var router = createRoute(req.url);
    var status = { status: CoffeeShop.status()._d.v };
    router.run(function (Handler) {
      var user = { user: req.user };
      const html = React.renderToString(
        <Handler bootstrap={status} auth = {user} />
      );
      res.render("index", {
        markup: html,
        bootstrap: JSON.stringify(status) || "{}",
        user: JSON.stringify(user) || "{}",
      });
    });
  });

  app.get("/login", function (req, res) {
    var router = createRoute(req.url);
    router.run(function (Handler) {
      var user = { user: req.user };
      const html = React.renderToString(
        <Handler auth = {user} />
      );
      res.render("index", {
        markup: html,
        user: JSON.stringify(user) || "{}",
        bootstrap: "{}"
      });
    });
  });

  app.post('/login', function (req, res, next) {
    User.login({
      email: req.body.email,
      password: req.body.password
    }, 'user' , function (err, accessToken) {
      if (err) {
        logger.error('AccessToken not found', err.message);
        return res.redirect('back');
      }
      //https://github.com/strongloop/loopback-component-passport/issues/57#issuecomment-140929082
      if (accessToken != null) {
        if (accessToken.id != null) {
          res.cookie('access_token', accessToken.id, {
            signed: req.signedCookies ? true : false,
            maxAge: 1000 * accessToken.ttl
          });
          res.cookie('userId', accessToken.userId.toString(), {
            signed: req.signedCookies ? true : false,
            maxAge: 1000 * accessToken.ttl
          });
        }
      }
      return res.redirect('/auth/account');
    });
  });

  app.get("/signup", function (req, res) {
    var router = createRoute(req.url);
    router.run(function (Handler) {
      var user = { user: req.user };
      const html = React.renderToString(
        <Handler auth = {user} />
      );
      res.render("index", {
        markup: html,
        user: JSON.stringify(user) || "{}",
        bootstrap: "{}"
      });
    });
  });

  //ToDo: code cleanup needed
  app.post('/signup', function (req, res, next) {
    var newUser = {};
    newUser.email = req.body.email.toLowerCase();
    newUser.username = req.body.firstName;
    newUser.password = req.body.password;

    User.create(newUser, function (err, user) {
      if (err) {
        logger.error('Error in creating user', err.message);
        return res.redirect('back');
      } else {
        var token = User.login({email: req.body.email, password: req.body.password});
        User.login({
          email: req.body.email,
          password: req.body.password
        }, 'user' , function (err, accessToken) {
          if (err) {
            logger.error('AccessToken not found', err.message);
            return res.redirect('back');
          }
          //https://github.com/strongloop/loopback-component-passport/issues/57#issuecomment-140929082
          if (accessToken != null) {
            if (accessToken.id != null) {
              res.cookie('access_token', accessToken.id, {
                signed: req.signedCookies ? true : false,
                maxAge: 1000 * accessToken.ttl
              });
              res.cookie('userId', accessToken.userId.toString(), {
                signed: req.signedCookies ? true : false,
                maxAge: 1000 * accessToken.ttl
              });
            }
          }
          return res.redirect('/auth/account');
        });
      }
    });
  });

  app.get("/auth/account", function (req, res) {
    var router = createRoute(req.url);
    router.run(function (Handler) {
      var user = { user: req.user };
      const html = React.renderToString(
        <Handler auth = {user} />
      );
      res.render("index", {
        markup: html,
        user: JSON.stringify(user) || "{}",
        bootstrap: "{}"
      });
    });
  });

  app.get('/logout', function (req, res, next) {
    if (!req.accessToken) {
      logger.error('AccessToken not found');
      return res.redirect('back');
    }
    User.logout(req.accessToken.id, function(err) {
      if (err) {
        logger.error("Problem in logout", err.message);
      }
      res.clearCookie('access_token');
      res.clearCookie('userId');
      res.redirect('/');
    });
  });

  app.get("/emaillist", function (req, res) {
    var router = createRoute(req.url);
    router.run(function (Handler) {
      var user = { user: req.user };
      const html = React.renderToString(
        <Handler auth = {user} />
      );
      res.render("index", {
        markup: html,
        user: JSON.stringify(user) || "{}",
        bootstrap: "{}"
      });
    });
  });

  app.get("/reviewers", function (req, res) {
    var router = createRoute(req.url);
    router.run(function (Handler) {
      Reviewer.find().then(function(model) {
        console.log("model",model);
        var reviewers = {reviewers: model};
        const html = React.renderToString(
          <Handler bootstrap = {reviewers} />
        );
        res.render("index", {
          markup: html,
          bootstrap: JSON.stringify(reviewers) || "{}"
        });
      });
    });
  });

}
