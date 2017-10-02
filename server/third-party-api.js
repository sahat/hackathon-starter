module.exports = function(app) {
  const apiController = require('../controllers/api');
  const multer = require('multer');
  const path = require('path');
  const upload = multer({ dest: path.join(__dirname, 'uploads') });
  const passportConfig = require('../config/passport');

  app.get('/api', apiController.getApi);
  app.get('/api/lastfm', apiController.getLastfm);
  app.get('/api/nyt', apiController.getNewYorkTimes);
  app.get('/api/aviary', apiController.getAviary);
  app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
  app.get('/api/stripe', apiController.getStripe);
  app.post('/api/stripe', apiController.postStripe);
  app.get('/api/scraping', apiController.getScraping);
  app.get('/api/twilio', apiController.getTwilio);
  app.post('/api/twilio', apiController.postTwilio);
  app.get('/api/clockwork', apiController.getClockwork);
  app.post('/api/clockwork', apiController.postClockwork);
  app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
  app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
  app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
  app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
  app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
  app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
  app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
  app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
  app.get('/api/paypal', apiController.getPayPal);
  app.get('/api/paypal/success', apiController.getPayPalSuccess);
  app.get('/api/paypal/cancel', apiController.getPayPalCancel);
  app.get('/api/lob', apiController.getLob);
  app.get('/api/upload', apiController.getFileUpload);
  app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
  app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
  app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
  app.get('/api/google-maps', apiController.getGoogleMaps);
}