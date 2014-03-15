var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');

var userQ = require('../models/userQueries');
var util = require('../config/util');


/**
 * GET /login
 * Login page.
 */

exports.getLogin = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 */

exports.postLogin = function(req, res, next) {
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
      req.flash('success', { msg: 'Success! You are logged in.' });
      return res.redirect('/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */

exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 * @param email
 * @param password
 */

exports.postSignup = function(req, res, next) {
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
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = function(req, res, next) {
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
};

/**
 * POST /account/password
 * Update current password.
 * @param password
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
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 * @param id - User ObjectId
 */

exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth2 provider from the current user.
 * @param provider
 * @param id - User ObjectId
 */

exports.getOauthUnlink = function(req, res, next) {
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
};











/*
 * Requests
 */

exports.getUsers = function(req, res, myData) {
  console.log(myData);
  userQ.getUsers(myData, function(model) {
    if( req.params.format == '.js' ) {
      res.send(model);
    } else {
      model.title = 'Users';
      res.render('users', model);
    }
  });
};

exports.getUser = function(req, res, myData) {
  userQ.getUser(myData, function(model) {
    if( req.params.format == '.js' ) {
      res.send(model);
    } else {
      model.title = 'Users';
      res.render('users', model);
    }
  });
};

exports.createUser = function(req, res, myData) {
  myData = myData.user ? myData.user : myData;
  userQ.createUser(myData, function(model) {
    res.send(model);
  });
}

exports.editUser = function(req, res, myData) {
  myData._id = myData._id || req.params.id;
  userQ.editUser(myData, function(model) {
    res.send(model);
  });
}

exports.deleteUser = function(req, res, myData) {
  userQ.deleteUser({id: req.params.id}, function(model) {
    res.send({'success':true});
  });
}




/*
 * Events
 */

exports.createUserEvent = function(socket, signature, myData) {
  var e = util.event('create:user', signature);
  myData._id = null; delete myData._id;
  userQ.createUser(myData, function(resData) {
    socket.emit(e, {id : resData._id});
    socket.broadcast.emit('adduser', resData);
  });
};

exports.readUserEvent = function(socket, signature, myData, sockets) {
  var e = util.event('read:user', signature);
  typeof myData==='undefined' ? myData={id:false}:'';
  if(myData.id) {
    userQ.getUser({id: myData.id}, function(resData) {
      socket.emit(e, resData);
    });
  } else {
    userQ.getUsers({}, function(resData) {
      socket.emit(e, resData);
    });
  }
};

exports.updateUserEvent = function(socket, signature, myData) {
  var e = util.event('update:user', signature);
  typeof myData==='undefined' ? myData={_id:false}:'';
  if(myData._id) {
    userQ.editUser(myData, function(resData) {
      socket.emit(e, {success: true});
      socket.broadcast.emit(e, resData);
    });
  }
};

exports.destroyUserEvent = function(socket, signature, myData) {
  var e = util.event('delete:user', signature);
  typeof myData==='undefined' ? myData={_id:false}:''; 
  if(myData._id) {
    userQ.deleteUser(myData, function(resData) {
      socket.emit(e, resData);
      socket.broadcast.emit(e, resData);
    });
  }
};
