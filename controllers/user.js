var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var request = require('request');
var qs = require('querystring');
var User = require('../models/User');

function generateToken(user) {
  var payload = {
    iss: 'my.domain.com',
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(7, 'days').unix()
  };
  return jwt.sign(payload, process.env.TOKEN_SECRET);
}

function createUser(req, res, err, user) {
  console.log("Crate User!");

  if (user) {
    return res.status(400).send({ msg: 'The email address you have entered is already associated with another account.' });
  }

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    isOrg: req.body.org
  });

  user.save(function(err) {
    res.send({ token: generateToken(user), user: user });
  });
}

/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

exports.ensureOrganizer = function(req, res, next) {
  console.log('req headers ', req.headers);
  if (req.isAuthenticated() && (req.user.isOrg) || req.headers.isorg) {
    console.log('hi');
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

  /**
   * POST /login
   * Sign in with email and password
   */
  exports.loginPost = function(req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.assert('password', 'Password cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    var errors = req.validationErrors();

    if (errors) {
      return res.status(400).send(errors);
    }

    User.findOne({ email: req.body.email }, function(err, user) {
      if (!user) {
        return res.status(401).send({ msg: 'The email address ' + req.body.email + ' is not associated with any account. ' +
        'Double-check your email address and try again.'
        });
      }
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (!isMatch) {
          return res.status(401).send({ msg: 'Invalid email or password' });
        }
        res.send({ token: generateToken(user), user: user.toJSON() });
      });
    });
  };

/**
 * POST /signup
 */
exports.signupPost = function(req, res, next) {
  console.log("SignupPost User!");

  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.sanitize('email').normalizeEmail({ remove_dots: false });
  console.log("survived assertions! User!");

  var errors = req.validationErrors();

  if (errors) {
    return res.status(400).send(errors);
  }

  if(req.body.org) {
    //Make sure there are no other admin users. We only support one right now...
    User.findOne({isOrg: true}, function(err, user) {
      if (user) {
        console.log("Admin... User already created");
        return res.status(400).send({ msg: 'An admin user has already been created.' });
      } else {
        console.log("Signing up admin...");
        User.findOne({ email: req.body.email }, function(err, user) {
          createUser(req, res, err, user);
        });
      }
    });
  } else {
    console.log("Signing up regular user...");
    //console.log(User);
    User.findOne({ email: req.body.email }, function(err, user) {
      console.log("Something happened");
      createUser(req, res, err, user);
    });
  }
};


/**
 * PUT /account
 * Update profile information OR change password.
 */
exports.accountPut = function(req, res, next) {
  if ('password' in req.body) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirm', 'Passwords must match').equals(req.body.password);
  } else {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
  }

  var errors = req.validationErrors();

  if (errors) {
    return res.status(400).send(errors);
  }

  User.findById(req.user.id, function(err, user) {
    if ('password' in req.body) {
      user.password = req.body.password;
    } else {
      user.email = req.body.email;
      user.name = req.body.name;
      user.gender = req.body.gender;
      user.location = req.body.location;
      user.website = req.body.website;
    }
    user.save(function(err) {
      if ('password' in req.body) {
        res.send({ msg: 'Your password has been changed.' });
      } else if (err && err.code === 11000) {
        res.status(409).send({ msg: 'The email address you have entered is already associated with another account.' });
      } else {
        res.send({ user: user, msg: 'Your profile information has been updated.' });
      }
    });
  });
};

/**
 * DELETE /account
 */
exports.accountDelete = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    res.send({ msg: 'Your account has been permanently deleted.' });
  });
};

/**
 * GET /unlink/:provider
 */
exports.unlink = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    switch (req.params.provider) {
      case 'facebook':
        user.facebook = undefined;
        break;
      case 'google':
        user.google = undefined;
        break;
      case 'twitter':
        user.twitter = undefined;
        break;
      case 'vk':
        user.vk = undefined;
        break;
      case 'github':
          user.github = undefined;
        break;
      default:
        return res.status(400).send({ msg: 'Invalid OAuth Provider' });
    }
    user.save(function(err) {
      res.send({ msg: 'Your account has been unlinked.' });
    });
  });
};

/**
 * POST /forgot
 */
exports.forgotPost = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  var errors = req.validationErrors();

  if (errors) {
    return res.status(400).send(errors);
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          return res.status(400).send({ msg: 'The email address ' + req.body.email + ' is not associated with any account.' });
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // expire in 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'support@yourdomain.com',
        subject: '✔ Reset your password on Mega Boilerplate',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        res.send({ msg: 'An email has been sent to ' + user.email + ' with further instructions.' });
        done(err);
      });
    }
  ]);
};

/**
 * POST /reset
 */
exports.resetPost = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirm', 'Passwords must match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
      return res.status(400).send(errors);
  }

  async.waterfall([
    function(done) {
      User.findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            return res.status(400).send({ msg: 'Password reset token is invalid or has expired.' });
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save(function(err) {
            done(err, user);
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
      var mailOptions = {
        from: 'support@yourdomain.com',
        to: user.email,
        subject: 'Your Mega Boilerplate password has been changed',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        res.send({ msg: 'Your password has been changed successfully.' });
      });
    }
  ]);
};

/**
 * POST /auth/facebook
 * Sign in with Facebook
 */
exports.authFacebook = function(req, res) {
  var profileFields = ['id', 'name', 'email', 'gender', 'location'];
  var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
  var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + profileFields.join(',');

  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.FACEBOOK_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Step 1. Exchange authorization code for access token.
  request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
    if (accessToken.error) {
      return res.status(500).send({ msg: accessToken.error.message });
    }

    // Step 2. Retrieve user's profile information.
    request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
      if (profile.error) {
        return res.status(500).send({ msg: profile.error.message });
      }

      // Step 3a. Link accounts if user is authenticated.
      if (req.isAuthenticated()) {
        User.findOne({ facebook: profile.id }, function(err, user) {
          if (user) {
            return res.status(409).send({ msg: 'There is already an existing account linked with Facebook that belongs to you.' });
          }
          user = req.user;
          user.name = user.name || profile.name;
          user.gender = user.gender || profile.gender;
          user.picture = user.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
          user.facebook = profile.id;
          user.save(function() {
            res.send({ token: generateToken(user), user: user });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ facebook: profile.id }, function(err, user) {
          if (user) {
            return res.send({ token: generateToken(user), user: user });
          }
          User.findOne({ email: profile.email }, function(err, user) {
            if (user) {
              return res.status(400).send({ msg: user.email + ' is already associated with another account.' })
            }
            user = new User({
              name: profile.name,
              email: profile.email,
              gender: profile.gender,
              location: profile.location && profile.location.name,
              picture: 'https://graph.facebook.com/' + profile.id + '/picture?type=large',
              facebook: profile.id
            });
            user.save(function(err) {
              return res.send({ token: generateToken(user), user: user });
            });
          });
        });
      }
    });
  });
};

exports.authFacebookCallback = function(req, res) {
  res.render('loading', { layout: false });
};
/**
 * POST /auth/twitter
 * Sign in with Twitter
 */
exports.authTwitter = function(req, res) {
  console.log('in auth twitter');
  var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
  var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';

  // Part 1 of 2: Initial POST request to obtain OAuth request token.
  if (!req.body.oauth_token || !req.body.oauth_verifier) {
    var requestTokenOauthSignature = {
      consumer_key: process.env.TWITTER_KEY,
      consumer_secret: process.env.TWITTER_SECRET,
      callback: req.body.redirectUri
    };

    // Step 1. Obtain request token to initiate app authorization.
    // At this point nothing is happening inside a popup yet.
    request.post({ url: requestTokenUrl, oauth: requestTokenOauthSignature }, function(err, response, body) {
      var oauthToken = qs.parse(body);

      // Step 2. Send OAuth token back.
      // After request token is sent back, a popup will redirect to the Twitter app authorization screen.
      // Unlike Facebook and Google (OAuth 2.0), we have to do this extra step for Twitter (OAuth 1.0).
      res.send(oauthToken);
    });
  } else {
    // Part 2 of 2: Second POST request after "Authorize app" button is clicked.
    // OAuth 2.0 basically starts from Part 2, but with OAuth 1.0 we need to do that extra step in Part 1.
    var accessTokenOauth = {
      consumer_key: process.env.TWITTER_KEY,
      consumer_secret: process.env.TWITTER_SECRET,
      token: req.body.oauth_token,
      verifier: req.body.oauth_verifier
    };

    // Step 3. Exchange "oauth token" and "oauth verifier" for access token.
    request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {
      accessToken = qs.parse(accessToken);

      var profileOauth = {
        consumer_key: process.env.TWITTER_KEY,
        consumer_secret: process.env.TWITTER_SECRET,
        oauth_token: accessToken.oauth_token
      };

      // Step 4. Retrieve user's profile information.
      request.get({ url: profileUrl + accessToken.screen_name, oauth: profileOauth, json: true }, function(err, response, profile) {

        // Step 5a. Link accounts if user is authenticated.
      if (req.isAuthenticated()) {
        User.findOne({ twitter: profile.id }, function(err, user) {
          if (user) {
            return res.status(409).send({ msg: 'There is already an existing account linked with Twitter that belongs to you.' });
          }
          user = req.user;
          user.name = user.name || profile.name;
          user.picture = user.picture || profile.profile_image_url_https;
          user.location = user.location || profile.location;
          user.twitter = profile.id;
          user.save(function(err) {
            res.send({ token: generateToken(user), user: user });
          });
        });
      } else {
        // Step 5b. Create a new user account or return an existing one.
        User.findOne({ twitter: profile.id }, function(err, user) {
          if (user) {
            return res.send({ token: generateToken(user), user: user });
          }
          // Twitter does not provide an email address, but email is a required field in our User schema.
          // We can "fake" a Twitter email address as follows: username@twitter.com.
          user = new User({
            name: profile.name,
            email: profile.screen_name + '@twitter.com',
            location: profile.location,
            picture: profile.profile_image_url_https,
            twitter: profile.id
          });
          user.save(function() {
            res.send({ token: generateToken(user), user: user });
          });
        });
      }
      });
    });
  }
};

exports.authTwitterCallback = function(req, res) {
  res.render('loading', { layout: false });
};

/**
 * POST /auth/google
 * Sign in with Google
 */
exports.authGoogle = function(req, res) {
  var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.GOOGLE_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: 'authorization_code'
  };

  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    var accessToken = token.access_token;
    var headers = { Authorization: 'Bearer ' + accessToken };

    // Step 2. Retrieve user's profile information.
    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
      if (profile.error) {
        return res.status(500).send({ message: profile.error.message });
      }
      // Step 3a. Link accounts if user is authenticated.
      if (req.isAuthenticated()) {
        User.findOne({ google: profile.sub }, function(err, user) {
          if (user) {
            return res.status(409).send({ msg: 'There is already an existing account linked with Google that belongs to you.' });
          }
          user = req.user;
          user.name = user.name || profile.name;
          user.gender = profile.gender;
          user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
          user.location = user.location || profile.location;
          user.google = profile.sub;
          user.save(function() {
            res.send({ token: generateToken(user), user: user });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ google: profile.sub }, function(err, user) {
          if (user) {
            return res.send({ token: generateToken(user), user: user });
          }
          user = new User({
            name: profile.name,
            email: profile.email,
            gender: profile.gender,
            picture: profile.picture.replace('sz=50', 'sz=200'),
            location: profile.location,
            google: profile.sub
          });
          user.save(function(err) {
            res.send({ token: generateToken(user), user: user });
          });
        });
      }
    });
  });
};

exports.authGoogleCallback = function(req, res) {
  res.render('loading', { layout: false });
};
