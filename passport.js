// Import required modules
const passport = require('passport');
const _ = require('lodash');
const moment = require('moment');
const axios = require('axios');
const User = require('../models/User');

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Common function to handle different services
const handleService = async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ [`${profile.provider}`]: profile.id });
      if (existingUser) {
        req.flash('errors', { msg: `There is already a ${_.startCase(profile.provider)} account that belongs to you. Sign in with that account or delete it, then link it with your current account.` });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user[`${profile.provider}`] = profile.id;
      user.tokens.push({ kind: `${profile.provider}`, accessToken });
      user.profile.name = user.profile.name || profile.displayName;
      user.profile.picture = user.profile.picture || profile.photos[0].value;
      await user.save();
      req.flash('info', { msg: `${_.startCase(profile.provider)} account has been linked.` });
      return done(null, user);
    }
    const existingUser = await User.findOne({ [`${profile.provider}`]: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const existingEmailUser = await User.findOne({ email: profile.emails[0].value });
    if (existingEmailUser) {
      req.flash('errors', { msg: `There is already an account using this email address. Sign in to that account and link it with ${_.startCase(profile.provider)} manually from Account Settings.` });
      return done(null, existingEmailUser);
    }
    const user = new User();
    user.email = profile.emails[0].value;
    user[`${profile.provider}`] = profile.id;
    user.tokens.push({ kind: `${profile.provider}`, accessToken });
    user.profile.name = profile.displayName;
    user.profile.picture = profile.photos[0].value;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

// Export common function
exports.handleService = handleService;

// Import required modules
const passport = require('passport');
const { handleService } = require('./passportUtils');
const User = require('../models/User');

// Sign in with Facebook
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
  profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    await handleService(req, accessToken, refreshToken, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, params, profile, done) => {
  try {
    await handleService(req, accessToken, refreshToken, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with Twitter
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/twitter/callback`,
  passReqToCallback: true
}, async (req, accessToken, tokenSecret, profile, done) => {
  try {
    await handleService(req, accessToken, tokenSecret, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with LinkedIn
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
  scope: ['r_liteprofile', 'r_emailaddress'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    await handleService(req, accessToken, refreshToken, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with GitHub
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
  passReqToCallback: true,
  scope: ['user:email']
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    await handleService(req, accessToken, refreshToken, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with Snapchat
passport.use(new SnapchatStrategy({
  clientID: process.env.SNAPCHAT_ID,
  clientSecret: process.env.SNAPCHAT_SECRET,
  callbackURL: '/auth/snapchat/callback',
  profileFields: ['id', 'displayName', 'bitmoji'],
  scope: ['user.display_name', 'user.bitmoji.avatar'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    await handleService(req, accessToken, refreshToken, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with Twitch
passport.use(new TwitchStrategy({
  clientID: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/twitch/callback`,
  scope: ['user_read', 'chat:read', 'chat:edit', 'whispers:read', 'whispers:edit', 'user:read:email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, params, profile, done) => {
  try {
    await handleService(req, accessToken, refreshToken, profile, done);
  } catch (err) {
    return done(err);
  }
}));

// Sign in with Steam
passport.use(new SteamOpenIdStrategy({
  apiKey: process.env.STEAM_KEY,
  returnURL: `${process.env.BASE_URL}/auth/steam/callback`,
  profile: true,
}, async (req, identifier, profile, done) => {
  try {
    const steamId = identifier.match(/\d+$/)[0];
    const profileURL = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_KEY}&steamids=${steamId}`;
    if (req.user) {
      const existingUser = await User.findOne({ steam: steamId });
      if (existingUser) {
        req.flash('errors', { msg: 'There is already an account associated with the SteamID. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.steam = steamId;
      user.tokens.push({ kind: 'steam', accessToken: steamId });
      try {
        const res = await axios.get(profileURL);
        const profileData = res.data.response.players[0];
        user.profile.name = user.profile.name || profileData.personaname;
        user.profile.picture = user.profile.picture || profileData.avatarmedium;
        await user.save();
        return done(null, user);
      } catch (err) {
        console.log(err);
        await user.save();
        return done(err, user);
      }
    } else {
      try {
        const { data } = await axios.get(profileURL);
        const profileData = data.response.players[0];
        const user = new User();
        user.steam = steamId;
        user.email = `${steamId}@steam.com`; // steam does not disclose emails, prevent duplicate keys
        user.tokens.push({ kind: 'steam', accessToken: steamId });
        user.profile.name = profileData.personaname;
        user.profile.picture = profileData.avatarmedium;
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  } catch (err) {
    return done(err);
  }
}));