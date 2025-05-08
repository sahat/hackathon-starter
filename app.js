/**
 * Module dependencies.
 */
const path = require('path');
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });

/**
 * Set config values
 */
const secureTransfer = process.env.BASE_URL.startsWith('https');

/**
 * Rate limiting configuration
 * This is a basic rate limiting configuration. You may want to adjust the settings
 * based on your application's needs and the expected traffic patterns.
 * Also, consider adding a proxy such as cloudflare for production.
 */
// Global Rate Limiter Config
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Strict Auth Rate Limiter Config for signup, password recover, account verification, login by email
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});

// Login Rate Limiter Config
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});

// This logic for numberOfProxies works for local testing, ngrok use, single host deployments
// behind cloudflare, etc. You may need to change it for more complex network settings.
// See readme.md for more info.
let numberOfProxies;
if (secureTransfer) numberOfProxies = 1;
else numberOfProxies = 0;

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const aiController = require('./controllers/ai');
const contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Request logging configuration
 */
const { morganLogger } = require('./config/morgan');

/**
 * Create Express server.
 */
const app = express();
console.log('Run this app using "npm start" to include sass/scss/css builds.\n');

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('MongoDB connection error. Please make sure MongoDB is running.');
  process.exit(1);
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', numberOfProxies);
app.use(morganLogger());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(
  session({
    resave: true, // Only save session if modified
    saveUninitialized: false, // Do not save sessions until we have something to store
    secret: process.env.SESSION_SECRET,
    name: 'startercookie', // change the cookie name for additional security in production
    cookie: {
      maxAge: 1209600000, // Two weeks in milliseconds
      secure: secureTransfer,
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload' || req.path === '/ai/togetherai-camera') {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    // WARN: Any path that is not protected by CSRF here should have lusca.csrf() chained
    // in their route handler.
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
// Function to validate if the URL is a safe relative path
const isSafeRedirect = (url) => /^\/[a-zA-Z0-9/_-]*$/.test(url);
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user && req.path !== '/login' && req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
    const returnTo = req.originalUrl;
    if (isSafeRedirect(returnTo)) {
      req.session.returnTo = returnTo;
    } else {
      req.session.returnTo = '/';
    }
  } else if (req.user && (req.path === '/account' || req.path.match(/^\/api/))) {
    const returnTo = req.originalUrl;
    if (isSafeRedirect(returnTo)) {
      req.session.returnTo = returnTo;
    } else {
      req.session.returnTo = '/';
    }
  }
  next();
});
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/@popperjs/core/dist/umd'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), { maxAge: 31557600000 }));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));
app.use('/image-cache', express.static(path.join(__dirname, 'tmp/image-cache'), { maxAge: 31557600000 }));

/**
 * Analytics IDs needed thru layout.pug; set as express local so we don't have to pass them with each render call
 */
app.locals.FACEBOOK_ID = process.env.FACEBOOK_ID ? process.env.FACEBOOK_ID : null;
app.locals.GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID ? process.env.GOOGLE_ANALYTICS_ID : null;
app.locals.FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID ? process.env.FACEBOOK_PIXEL_ID : null;

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', loginLimiter, userController.postLogin);
app.get('/login/verify/:token', loginLimiter, userController.getLoginByEmail);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', strictLimiter, userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', loginLimiter, userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', strictLimiter, contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account/verify', passportConfig.isAuthenticated, userController.getVerifyEmail);
app.get('/account/verify/:token', passportConfig.isAuthenticated, userController.getVerifyEmailToken);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.post('/account/logout-everywhere', passportConfig.isAuthenticated, userController.postLogoutEverywhere);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/foursquare', apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', apiController.getGithub);
app.get('/api/twitch', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitch);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', lusca({ csrf: true }), apiController.getFileUpload);
app.post('/api/upload', strictLimiter, apiController.uploadMiddleware, lusca({ csrf: true }), apiController.postFileUpload);
app.get('/api/here-maps', apiController.getHereMaps);
app.get('/api/google-maps', apiController.getGoogleMaps);
app.get('/api/google/drive', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGoogleDrive);
app.get('/api/chart', apiController.getChart);
app.get('/api/google/sheets', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGoogleSheets);
app.get('/api/quickbooks', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getQuickbooks);
app.get('/api/trakt', apiController.getTrakt);

/**
 * AI Integrations and Boilerplate example routes.
 */
app.get('/ai', aiController.getAi);
app.get('/ai/openai-moderation', aiController.getOpenAIModeration);
app.post('/ai/openai-moderation', aiController.postOpenAIModeration);
app.get('/ai/togetherai-classifier', aiController.getTogetherAIClassifier);
app.post('/ai/togetherai-classifier', aiController.postTogetherAIClassifier);
app.get('/ai/togetherai-camera', lusca({ csrf: true }), aiController.getTogetherAICamera);
app.post('/ai/togetherai-camera', strictLimiter, aiController.imageUploadMiddleware, lusca({ csrf: true }), aiController.postTogetherAICamera);
app.get('/ai/rag', aiController.getRag);
app.post('/ai/rag/ingest', aiController.postRagIngest);
app.post('/ai/rag/ask', aiController.postRagAsk);

/**
 * OAuth authentication failure handler (common for all providers)
 * passport.js requires a static route for failureRedirect.
 * With this auth failure handler, we can decide where to redirect the user
 * and avoid infinite loops in cases when they navigate to a route
 * protected by isAuthorized and the user is not authorized.
 */
app.get('/auth/failure', (req, res) => {
  // Check if a flash message for 'errors' already exists in the session (do not consume it)
  const hasErrorFlash = req.session && req.session.flash && req.session.flash.errors && req.session.flash.errors.length > 0;

  if (!hasErrorFlash) {
    req.flash('errors', { msg: 'Authentication failed or provider account is already linked.' });
  }
  const { returnTo } = req.session;
  req.session.returnTo = undefined;
  // Prevent infinite loop: if returnTo is the current URL or an /auth/ route, redirect to /
  if (!returnTo || !isSafeRedirect(returnTo) || returnTo === req.originalUrl || /^\/auth\//.test(returnTo)) {
    res.redirect('/');
  } else {
    res.redirect(returnTo);
  }
});

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/x', passport.authenticate('X'));
app.get('/auth/x/callback', passport.authenticate('X', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin'));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitch', passport.authenticate('twitch'));
app.get('/auth/twitch/callback', passport.authenticate('twitch', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/steam', passport.authorize('steam-openid'));
app.get('/auth/steam/callback', passport.authorize('steam-openid', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/trakt', passport.authorize('trakt'));
app.get('/auth/trakt/callback', passport.authorize('trakt', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/quickbooks', passport.authorize('quickbooks'));
app.get('/auth/quickbooks/callback', passport.authorize('quickbooks', { failureRedirect: '/auth/failure' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * Error Handler.
 */
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  res.status(404).send('Page Not Found');
});

if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  const { BASE_URL } = process.env;
  const colonIndex = BASE_URL.lastIndexOf(':');
  const port = parseInt(BASE_URL.slice(colonIndex + 1), 10);

  if (!BASE_URL.startsWith('http://localhost')) {
    console.log(
      `The BASE_URL env variable is set to ${BASE_URL}. If you directly test the application through http://localhost:${app.get('port')} instead of the BASE_URL, it may cause a CSRF mismatch or an Oauth authentication failure. To avoid the issues, change the BASE_URL or configure your proxy to match it.\n`,
    );
  } else if (app.get('port') !== port) {
    console.warn(`WARNING: The BASE_URL environment variable and the App have a port mismatch. If you plan to view the app in your browser using the localhost address, you may need to adjust one of the ports to make them match. BASE_URL: ${BASE_URL}\n`);
  }

  console.log(`App is running on http://localhost:${app.get('port')} in ${app.get('env')} mode.`);
  console.log('Press CTRL-C to stop.');
});

module.exports = app;
