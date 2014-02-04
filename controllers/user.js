/**
 * Module Dependencies
 */

var mongoose      = require('mongoose');
var passport      = require('passport');
var passportConf  = require('../config/passport');
var _             = require('underscore');
var User          = require('../models/User');

module.exports.controller = function(app) {

/**
 * GET /login route
 */
  app.get('/login', function(req, res) {
    if (req.user) return res.redirect('/');
    res.render('account/login', {
      title: 'Login'
    });
  });


/**
 * POST /login route
 */
  app.post('/login', function(req, res, next) {

    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/login');
    }

    passport.authenticate('local', function(err, user, info) {
      if (err) return next(err);

      if (!user) {
        req.flash('errors', { msg: info.message });
        return res.redirect('/login');
      }

      req.logIn(user, function(err) {
        if (err) return next(err);
        return res.redirect('/');
      });
    })(req, res, next);

  });


/**
 * GET /logout route
 */
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

/**
 * GET /signup route
 */
  app.get('/signup', function(req, res) {
    if (req.user) return res.redirect('/');
    res.render('account/signup', {
      title: 'Create Account'
    });
  });


/**
 * POST /signup route
 */
  app.post('/signup', function(req, res, next) {

    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/signup');
    }

    var user = new User({
      email: req.body.email,
      password: req.body.password
    });

    user.save(function(err) {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'User with that email already exists.' });
        }
        return res.redirect('/signup');
      }
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });

  });


/**
 * GET /account route
 */
  app.get('/account', passportConf.isAuthenticated, function(req, res) {
    res.render('account/profile', {
      title: 'Account Management'
    });
  });


/**
 * POST /account/profile route
 */
  app.post('/account/profile', passportConf.isAuthenticated, function(req, res) {
    User.findById(req.user.id, function(err, user) {
      if (err) return next(err);
      user.email = req.body.email || '';
      user.profile.name = req.body.name || '';
      user.profile.gender = req.body.gender || '';
      user.profile.location = req.body.location || '';
      user.profile.website = req.body.website || '';

      user.save(function(err) {
        if (err) return next(err);
        req.flash('success', { msg: 'Profile information updated.' });
        res.redirect('/account');
      });
    });
  });


/**
 * POST /account/password route
 */
  app.post('/account/password', passportConf.isAuthenticated, function(req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/account');
    }

    User.findById(req.user.id, function(err, user) {
      if (err) return next(err);

      user.password = req.body.password;

      user.save(function(err) {
        if (err) return next(err);
        req.flash('success', { msg: 'Password has been changed.' });
        res.redirect('/account');
      });
    });
  });


/**
 * POST /account/delete route
 */
  app.post('/account/delete', passportConf.isAuthenticated, function(req, res, next) {
    User.remove({ _id: req.user.id }, function(err) {
      if (err) return next(err);
      req.logout();
      res.redirect('/');
    });
  });


/**
 * GET /account/unlink/:provider route
 */
  app.get('/account/unlink/:provider', passportConf.isAuthenticated, function(req, res, next) {
    var provider = req.params.provider;
    User.findById(req.user.id, function(err, user) {
      if (err) return next(err);

      user[provider] = undefined;
      user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

      user.save(function(err) {
        if (err) return next(err);
        req.flash('info', { msg: provider + ' account has been unlinked.' });
        res.redirect('/account');
      });
    });
  });


/**
 * OAuth routes for sign-in.
 */

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
  app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/',
                                                                         failureRedirect: '/login' }));

  app.get('/auth/github', passport.authenticate('github'));
  app.get('/auth/github/callback', passport.authenticate('github', { successRedirect: '/',
                                                                     failureRedirect: '/login' }));

  app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
  app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/',
                                                                     failureRedirect: '/login' }));

  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/',
                                                                       failureRedirect: '/login' }));

}
