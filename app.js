/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('fs');
var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

var util = require('./config/util');

/**
 * Load controllers.
 */

var homeController = require('./controllers/home');
var apiController = require('./controllers/api');
var contactController = require('./controllers/contact');

var userController = require('./controllers/user');
var postController = require('./controllers/post');


/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * socket.io config
 */

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


/**
 * Mongoose configuration.
 */

mongoose.connect(secrets.dbUrl());
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(connectAssets({
  paths: ['public/css', 'public/js'],
  helperContext: app.locals
}));
app.use(express.compress());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
console.log(secrets.dbSession);
app.use(express.session({
  secret: secrets.sessionSecret,
  store: new MongoStore({
    db: mongoose.connection.db,//secrets.dbSession.db
    auto_reconnect: true
  })
}));
app.use(express.csrf());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals._csrf = req.csrfToken();
  res.locals.secrets = secrets;
  next();
});
app.use(flash());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: month }));
app.use(function(req, res, next) {
  // Keep track of previous URL
  if (req.method !== 'GET') return next();
  var path = req.path.split('/')[1];
  if (/(auth|login|logout|signup)$/i.test(path)) return next();
  req.session.returnTo = req.path;
  next();
});
app.use(app.router);
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});
app.use(express.errorHandler());

/**
 * Application routes.
 */

app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/steam', apiController.getSteam);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);

/**
 * OAuth routes for sign-in.
 */

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth routes for API examples that require authorization.
 */

app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/tumblr');
});
app.get('/auth/venmo', passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }));
app.get('/auth/venmo/callback', passport.authorize('venmo', { failureRedirect: '/api' }), function(req, res) {
  res.redirect('/api/venmo');
});


/**
 * API routes.
 */

// new User
app.post('/users?:format?/?$', function(req, res) {
  userController.createUser(req, res, req.body);
});
app.post('/users?:format?/create/?$', function(req, res) {
  userController.createUser(req, res, req.body);
});
app.get('/users?:format?/create/?$', function(req, res) {
  userController.createUser(req, res, req.query);
});
// edit User
app.put('/users?:format?/:id/?$', function(req,res) {
  userController.editUser(req, res, req.body);
});
app.get('/users?:format?/:id/edit/?$', function(req,res) {
  userController.editUser(req, res, req.query);
});
// delete User
app.del('/users?:format?/:id/?$', function(req,res) {
  userController.deleteUser(req, res, req.body);
});
app.get('/users?:format?/:id/delete/?$', function(req,res) {
  userController.deleteUser(req, res, req.query);
});
// single User
app.get('/users?:format?/:id/?$', function(req, res) {
  userController.getUser(req, res, req.query);
});
// all Users
app.get('/users?:format?/?$', function(req, res) {//util.requireRole('admin'),
  userController.getUsers(req, res, req.query);
});


// new Post
app.post('/posts?:format?/?$', function(req, res) {
  postController.createPost(req, res, req.body);
});
app.post('/posts?:format?/create/?$', function(req, res) {
  postController.createPost(req, res, req.body);
});
app.get('/posts?:format?/create/?$', function(req, res) {
  postController.createPost(req, res, req.query);
});
// edit Post
app.put('/posts?:format?/:id/?$', function(req,res) {
  postController.editPost(req, res, req.body);
});
app.get('/posts?:format?/:id/edit/?$', function(req,res) {
  postController.editPost(req, res, req.query);
});
// delete Post
app.del('/posts?:format?/:id/?$', function(req,res) {
  postController.deletePost(req, res, req.body);
});
app.get('/posts?:format?/:id/delete/?$', function(req,res) {
  postController.deletePost(req, res, req.query);
});
// single Post
app.get('/posts?:format?/:id/?$', function(req, res) {
  postController.getPost(req, res, req.query);
});
// all Posts
app.get('/posts?:format?/?$', function(req, res) {//util.requireRole('admin'),
  postController.getPosts(req, res, req.query);
});


/**
 * Start Express server.
 */

server.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;




/*
 * Socket Events
 */

io.sockets.on('connection', function (socket) {
  
  socket.on('create:user', function (data) {
    userController.createUserEvent(socket, data.signature, data.item);
  });
  socket.on('read:user', function (data) {
    userController.readUserEvent(socket, data.signature, data);
  });
  socket.on('update:user', function (data) {
    userController.updateUserEvent(socket, data.signature, data.item);
  });
  socket.on('delete:user', function (data) {
    userController.destroyUserEvent(socket, data.signature, data.item);
  });
  
  socket.on('create:post', function (data) {
    postController.createPostEvent(socket, data.signature, data.item);
  });
  socket.on('read:post', function (data) {
    postController.readPostEvent(socket, data.signature, data);
  });
  socket.on('update:post', function (data) {
    postController.updatePostEvent(socket, data.signature, data.item);
  });
  socket.on('delete:post', function (data) {
    postController.destroyPostEvent(socket, data.signature, data.item);
  });
});
