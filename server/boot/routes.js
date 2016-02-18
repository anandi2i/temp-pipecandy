import React from "react";
import Router from "react-router";
import reactRoutes from "../../client/routes";
import logger from '../log';
import flash from 'express-flash';

module.exports = function routes(app) {

  function createRoute (url){
    return Router.create({
      location: url,
      routes: reactRoutes
    });
  }

  var CoffeeShop = app.models.CoffeeShop;
  var Reviewer = app.models.Reviewer;

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

    var User = app.models.user;

    var newUser = {};
    newUser.email = req.body.email.toLowerCase();
    newUser.username = req.body.firstName;
    newUser.password = req.body.password;

    User.create(newUser, function (err, user) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        // Passport exposes a login() function on req (also aliased as logIn())
        // that can be used to establish a login session. This function is
        // primarily used when users sign up, during which req.login() can
        // be invoked to log in the newly registered user.
        req.login(user, function (err, data) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          return res.redirect('/auth/account');
        });
      }
    });
  });

  //TODO: Access token not set for local signup
  //https://github.com/strongloop/loopback-component-passport/issues/57#issuecomment-140929082
  app.get("/auth/account", function (req, res) {
    var router = createRoute(req.url);
    router.run(function (Handler) {
      var user = { user: req.user };
      const html = React.renderToString(
        <Handler auth = {user} />
      );

      var accessToken  = req.accessToken || "";
      if(accessToken) {
        res.cookie('access_token', accessToken.id, {
          signed: req.signedCookies ? true : false,
          maxAge: 1000 * accessToken.ttl
        });
        res.cookie('userId', accessToken.userId.toString(), {
          signed: req.signedCookies ? true : false,
          maxAge: 1000 * accessToken.ttl
        });
      }

      res.render("index", {
        markup: html,
        user: JSON.stringify(user) || "{}",
        bootstrap: "{}"
      });
    });
  });

  //TODO: clearCookie needs to be moved to remote hook
  app.get('/auth/logout', function (req, res, next) {
    req.logout();
    res.clearCookie('access_token');
    res.clearCookie('userId');
    res.redirect('/');
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

