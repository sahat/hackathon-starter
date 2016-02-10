var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var graph = require('fbgraph');
var request = require('request');


/**
 * GET /login
 * Login page.
 */
exports.getLogin = function(req, res) {
   res.setHeader('Content-Type', 'application/json');
  if (req.user) {
      res.send(JSON.stringify(req.user));
   } else {
        res.redirect('/app.html#/login');
   }

};

//GET /extendFbToken

exports.extendFbToken = function(req, myres){
    req.params.client_id = secrets.facebook.clientID;
    req.params.client_secret = secrets.facebook.clientSecret;
    req.params.access_token = req.params.token;
    console.log("*****" + req.params.token);

    return graph.extendAccessToken(req.params, function(err, res){
            var newToken = res.access_token;
            if(err){
                return myres.send(JSON.stringify(err));

            }
            return myres.send(JSON.stringify({newToken: newToken}));
    });
}
/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.status(400).send(JSON.stringify({errors:errors}));
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('errors', { msg: info.message });
      return  res.status(400).send(JSON.stringify({errors:errors}));
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', { msg: 'Success! You are logged in.' });
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(user));
    });
  })(req, res, next);
};

exports.getUserDetails = function(req, res, next){
    res.setHeader('Content-Type', 'application/json');

    User.findById(req.params.id, function(err, user) {
        if(user){
            delete user.tokens;
            return res.send(JSON.stringify(user));
        } else {
            res.status(500).send(JSON.stringify(err));
        }
    });
}

exports.getUserFacebookInsight = function(req, res, next){
    graph = require('fbgraph');
    var userId = req.params.userId;
    var postId = req.params.postId;

    User.findById(userId, function(err, user) {
        if(user){
            var accessToken = "";
            for (var i=0; i< user.tokens.length; i++){
                if(user.tokens[i].kind == 'facebook'){
                    accessToken = user.tokens[i].accessToken;
                    break;
                }
            }
            var url = secrets.lambda.endPoint + '/insights/facebook?accessToken=' + accessToken;
            url += (postId && postId !== '')?("&postId=" + postId):( "&pageId = " + user.profile.facebookDefaultPageId);
            console.log("Request Url:" + url);
            var scheduleOptions = {
                method: 'GET',
                url: url,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': secrets.lambda.apiKey
                }
            };
            request(scheduleOptions, function(error, response, finalBody) {
                if (error) {
                    console.error("Unable to update the post ID to application collection using lambda service.");
                    console.error(error);
                    return res.send(JSON.stringify(error));
                } else {
                    console.log(finalBody);
                    console.log("success");
                    return res.send(response);
                }

            });
        } else {
            res.send({errorMessage:"User is not found."});
        }
    });
}
/**
 * GET /logout
 * Log out.
 */
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/app.html');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = function(req, res) {
  if (req.user) {
    return res.redirect('/app.html');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();
  res.setHeader('Content-Type', 'application/json');
  if (errors) {
    res.status(400).send(JSON.stringify({errors:errors}));
  }

  var user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
    errors = [{ msg: 'Account with that email address already exists.' }];
      return res.status(400).send(JSON.stringify({errors:errors}));
    }
    user.save(function(err) {
      if (err) {
        return res.status(500).send(JSON.stringify({errors:err}));
      }
      req.logIn(user, function(err) {
        if (err) {
             return res.status(500).send(JSON.stringify({errors:err}));
        }
        return res.send(JSON.stringify(user));
      });
    });
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = function(req, res) {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * PATCH /account/campaigns
 * Update campaigns information.
 */
exports.patchUpdateCampaigns = function(req, res) {
    User.update({"_id" : req.body.user.id}, 
        { $push: { 'campaignIds' : req.body.campaignId } }, 
        { }, 
        function(err, data){
            if (err) {
                console.error(err);
                return res.status(400).send(JSON.stringify({errors:err}));
            }
            return res.send({"message" : "campaign Ids updated"});
        });   
};

exports.patchUpdateProfile = function(req, res) {
    
    var context = {};
    var body = req.body;
    
    var alloweUpdateFields = {
        "name": true,
        "gender": true,
        "location": true,
        "website": true,
        "picture": true,
        "facebookDefaultPageId": true
    };
    
    var passed = true;
    var userId = body.user.id;
    
    delete body.user;
    
    for (var property in body) {
        if (body.hasOwnProperty(property) && alloweUpdateFields[property] === undefined) {
            passed = false;
            return res.status(409).send(JSON.stringify({errors:"only name, gender, location, website, picture, facebookDefaultPageId are accepted."}));
        }
        
        context["profile." + property] = body[property];
    }
    
    console.log(context);
    
    if (passed) {
        User.update({"_id" : userId}, 
            { $set : context }, 
            {}, 
            function(err, data){
                if (err) {
                    console.error(err);
                    return res.status(400).send(JSON.stringify({errors:err}));
                }
                return res.send({"message" : "user profile updated"});
            });   
    }
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.tokens = req.body.tokens || '';
    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/app.html');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });
    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: provider + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/app.html');
  }
  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (err) {
            return next(err);
          }
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          user.save(function(err) {
            if (err) {
              return next(err);
            }
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: secrets.sendgrid.user,
          pass: secrets.sendgrid.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Your Hackathon Starter password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/app.html');
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/app.html');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = function(req, res, next) {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          req.flash('errors', { msg: 'No account with that email address exists.' });
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: secrets.sendgrid.user,
          pass: secrets.sendgrid.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'hackathon@starter.com',
        subject: 'Reset your password on Hackathon Starter',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/forgot');
  });
};