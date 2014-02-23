var secrets = require('../config/secrets');
var User = require('../models/User');
var querystring = require('querystring');
var async = require('async');
var _ = require('underscore');
var graph = require('fbgraph');
var Github = require('github-api');
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);

/**
 * GET /api
 * List of API examples.
 */

exports.getApi = function(req, res) {
  res.render('api/index', {
    title: 'API Browser'
  });
};

/**
 * GET /api/facebook
 * Facebook API example.
 */

exports.getFacebook = function(req, res, next) {
  var token = _.findWhere(req.user.tokens, { kind: 'facebook' });
  graph.setAccessToken(token.accessToken);
  async.parallel({
      getMe: function(done) {
        graph.get(req.user.facebook, function(err, me) {
          done(err, me);
        });
      },
      getMyFriends: function(done) {
        graph.get(req.user.facebook + '/friends', function(err, friends) {
          done(err, friends.data);
        });
      }
    },
    function(err, results) {
      if (err) return next(err);
      res.render('api/facebook', {
        title: 'Facebook API',
        me: results.getMe,
        friends: results.getMyFriends
      });
    });
};


/**
 * GET /api/github
 * GitHub API Example.
 */
exports.getGithub = function(req, res) {
  var token = _.findWhere(req.user.tokens, { kind: 'github' });
  var github = new Github({ token: token.accessToken });
  var repo = github.getRepo('sahat', 'requirejs-library');
  repo.show(function(err, repo) {
    res.render('api/github', {
      title: 'GitHub API',
      repo: repo
    });
  });

};

/**
 * GET /api/twilio
 * Twilio API example.
 */

exports.getTwilio = function(req, res, next) {
  res.render('api/twilio', {
    title: 'Twilio API'
  });
};


/**
 * POST /api/twilio
 * Twilio API example.
 * @param telephone
 */

exports.postTwilio = function(req, res, next) {
  var message = {
    to: req.body.telephone,
    from: '+13472235148',
    body: 'Hello from the Hackathon Starter'
  };
  twilio.sendMessage(message, function(err, responseData) {
    if (err) return next(err.message);
    req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'})
    res.send(200);
  });
};
