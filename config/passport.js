const passport = require('passport');
const refresh = require('passport-oauth2-refresh');
const axios = require('axios');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: SnapchatStrategy } = require('passport-snapchat');
const { Strategy: TwitterStrategy } = require('@passport-js/passport-twitter');
const { Strategy: TwitchStrategy } = require('twitch-passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');
const { SteamOpenIdStrategy } = require('passport-steam-openid');
const { OAuthStrategy } = require('passport-oauth');
const { OAuth2Strategy } = require('passport-oauth');
const _ = require('lodash');
const moment = require('moment');

const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    return done(null, await User.findById(id));
  } catch (error) {
    return done(error);
  }
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() })
    .then((user) => {
      if (!user) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }
      if (!user.password) {
        return done(null, false, { msg: 'Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.' });
      }
      user.comparePassword(password, (err, isMatch) => {
        if (err) { return done(err); }
        if (isMatch) {
          return done(null, user);
        }
        return done(null, false, { msg: 'Invalid email or password.' });
      });
    })
    .catch((err) => done(err));
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Snapchat.
 */
passport.use(new SnapchatStrategy({
  clientID: process.env.SNAPCHAT_ID,
  clientSecret: process.env.SNAPCHAT_SECRET,
  callbackURL: '/auth/snapchat/callback',
  profileFields: ['id', 'displayName', 'bitmoji'],
  scope: ['user.display_name', 'user.bitmoji.avatar'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ snapchat: profile.id });
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Snapchat account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.snapchat = profile.id;
      user.tokens.push({ kind: 'snapchat', accessToken });
      user.profile.name = user.profile.name || profile.displayName;
      user.profile.picture = user.profile.picture || profile.bitmoji.avatarUrl;
      await user.save();
      req.flash('info', { msg: 'Snapchat account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ snapchat: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const user = new User();
    // Assign a temporary e-mail address
    // to get on with the registration process. It can be changed later
    // to a valid e-mail address in Profile Management.
    user.email = `${profile.id}@snapchat.com`;
    user.snapchat = profile.id;
    user.tokens.push({ kind: 'snapchat', accessToken });
    user.profile.name = profile.displayName;
    user.profile.picture = profile.bitmoji.avatarUrl;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
  profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ facebook: profile.id });
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.facebook = profile.id;
      user.tokens.push({ kind: 'facebook', accessToken });
      user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
      user.profile.gender = user.profile.gender || profile._json.gender;
      user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
      await user.save();
      req.flash('info', { msg: 'Facebook account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ facebook: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const existingEmailUser = await User.findOne({ email: profile._json.email });
    if (existingEmailUser) {
      req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
      return done(null, existingEmailUser);
    }
    const user = new User();
    user.email = profile._json.email;
    user.facebook = profile.id;
    user.tokens.push({ kind: 'facebook', accessToken });
    user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
    user.profile.gender = profile._json.gender;
    user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
    user.profile.location = profile._json.location ? profile._json.location.name : '';
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
  passReqToCallback: true,
  scope: ['user:email']
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ github: profile.id });
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.github = profile.id;
      user.tokens.push({ kind: 'github', accessToken });
      user.profile.name = user.profile.name || profile.displayName;
      user.profile.picture = user.profile.picture || profile._json.avatar_url;
      user.profile.location = user.profile.location || profile._json.location;
      user.profile.website = user.profile.website || profile._json.blog;
      await user.save();
      req.flash('info', { msg: 'GitHub account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ github: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const emailValue = _.get(_.orderBy(profile.emails, ['primary', 'verified'], ['desc', 'desc']), [0, 'value'], null);
    if (profile._json.email === null) {
      const existingEmailUser = await User.findOne({ email: emailValue });

      if (existingEmailUser) {
        req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
        return done(null, existingEmailUser);
      }
    } else {
      const existingEmailUser = await User.findOne({ email: profile._json.email });
      if (existingEmailUser) {
        req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
        return done(null, existingEmailUser);
      }
    }
    const user = new User();
    user.email = emailValue;
    user.github = profile.id;
    user.tokens.push({ kind: 'github', accessToken });
    user.profile.name = profile.displayName;
    user.profile.picture = profile._json.avatar_url;
    user.profile.location = profile._json.location;
    user.profile.website = profile._json.blog;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Sign in with Twitter.
 */
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/twitter/callback`,
  passReqToCallback: true
}, async (req, accessToken, tokenSecret, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ twitter: profile.id });
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.twitter = profile.id;
      user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
      user.profile.name = user.profile.name || profile.displayName;
      user.profile.location = user.profile.location || profile._json.location;
      user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
      await user.save();
      req.flash('info', { msg: 'Twitter account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ twitter: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const user = new User();
    // Twitter will not provide an email address.  Period.
    // But a person’s twitter username is guaranteed to be unique
    // so we can "fake" a twitter email address as follows:
    user.email = `${profile.username}@twitter.com`;
    user.twitter = profile.id;
    user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
    user.profile.name = profile.displayName;
    user.profile.location = profile._json.location;
    user.profile.picture = profile._json.profile_image_url_https;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Sign in with Google.
 */
const googleStrategyConfig = new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, params, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ google: profile.id });
      if (existingUser && (existingUser.id !== req.user.id)) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.google = profile.id;
      user.tokens.push({
        kind: 'google',
        accessToken,
        accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
        refreshToken,
      });
      user.profile.name = user.profile.name || profile.displayName;
      user.profile.gender = user.profile.gender || profile._json.gender;
      user.profile.picture = user.profile.picture || profile._json.picture;
      await user.save();
      req.flash('info', { msg: 'Google account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ google: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const existingEmailUser = await User.findOne({ email: profile.emails[0].value });
    if (existingEmailUser) {
      req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
      return done(null, existingEmailUser);
    }
    const user = new User();
    user.email = profile.emails[0].value;
    user.google = profile.id;
    user.tokens.push({
      kind: 'google',
      accessToken,
      accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
      refreshToken,
    });
    user.profile.name = profile.displayName;
    user.profile.gender = profile._json.gender;
    user.profile.picture = profile._json.picture;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});
passport.use('google', googleStrategyConfig);
refresh.use('google', googleStrategyConfig);

/**
 * Sign in with LinkedIn.
 */
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
  scope: ['r_liteprofile', 'r_emailaddress'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ linkedin: profile.id });
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.linkedin = profile.id;
      user.tokens.push({ kind: 'linkedin', accessToken });
      user.profile.name = user.profile.name || profile.displayName;
      user.profile.picture = user.profile.picture || profile.photos[3].value;
      await user.save();
      req.flash('info', { msg: 'LinkedIn account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ linkedin: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const existingEmailUser = await User.findOne({ email: profile.emails[0].value });
    if (existingEmailUser) {
      req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.' });
      return done(null, existingEmailUser);
    }
    const user = new User();
    user.linkedin = profile.id;
    user.tokens.push({ kind: 'linkedin', accessToken });
    user.email = profile.emails[0].value;
    user.profile.name = profile.displayName;
    user.profile.picture = user.profile.picture || profile.photos[3].value;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Twitch API OAuth.
 */
const twitchStrategyConfig = new TwitchStrategy({
  clientID: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/twitch/callback`,
  scope: ['user_read', 'chat:read', 'chat:edit', 'whispers:read', 'whispers:edit', 'user:read:email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, params, profile, done) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ twitch: profile.id });
      if (existingUser && existingUser.id !== req.user.id) {
        req.flash('errors', { msg: 'There is already a Twitch account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, existingUser);
      }
      const user = await User.findById(req.user.id);
      user.twitch = profile.id;
      user.tokens.push({
        kind: 'twitch',
        accessToken,
        accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
        refreshToken,
      });
      user.profile.name = user.profile.name || profile.display_name;
      user.profile.email = user.profile.gender || profile.email;
      user.profile.picture = user.profile.picture || profile.profile_image_url;
      await user.save();
      req.flash('info', { msg: 'Twitch account has been linked.' });
      return done(null, user);
    }
    const existingUser = await User.findOne({ twitch: profile.id });
    if (existingUser) {
      return done(null, existingUser);
    }
    const existingEmailUser = await User.findOne({ email: profile.email });
    if (existingEmailUser) {
      req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Twitch manually from Account Settings.' });
      return done(null, existingEmailUser);
    }
    const user = new User();
    user.email = profile.email;
    user.twitch = profile.id;
    user.tokens.push({
      kind: 'twitch',
      accessToken,
      accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
      refreshToken,
    });
    user.profile.name = profile.display_name;
    user.profile.email = profile.email;
    user.profile.picture = profile.profile_image_url;
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});
passport.use('twitch', twitchStrategyConfig);
refresh.use('twitch', twitchStrategyConfig);

/**
 * Tumblr API OAuth.
 */
passport.use('tumblr', new OAuthStrategy({
  requestTokenURL: 'https://www.tumblr.com/oauth/request_token',
  accessTokenURL: 'https://www.tumblr.com/oauth/access_token',
  userAuthorizationURL: 'https://www.tumblr.com/oauth/authorize',
  consumerKey: process.env.TUMBLR_KEY,
  consumerSecret: process.env.TUMBLR_SECRET,
  callbackURL: '/auth/tumblr/callback',
  passReqToCallback: true
},
async (req, token, tokenSecret, profile, done) => {
  try {
    const user = await User.findById(req.user._id);
    user.tokens.push({ kind: 'tumblr', accessToken: token, tokenSecret });
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Foursquare API OAuth.
 */
passport.use('foursquare', new OAuth2Strategy({
  authorizationURL: 'https://foursquare.com/oauth2/authorize',
  tokenURL: 'https://foursquare.com/oauth2/access_token',
  clientID: process.env.FOURSQUARE_ID,
  clientSecret: process.env.FOURSQUARE_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/foursquare/callback`,
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findById(req.user._id);
    user.tokens.push({ kind: 'foursquare', accessToken });
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Steam API OpenID.
 */
passport.use(new SteamOpenIdStrategy({
  apiKey: process.env.STEAM_KEY,
  returnURL: `${process.env.BASE_URL}/auth/steam/callback`,
  profile: true,
}, async (req, identifier, profile, done) => {
  const steamId = identifier.match(/\d+$/)[0];
  const profileURL = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_KEY}&steamids=${steamId}`;
  try {
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

/**
 * Pinterest API OAuth.
 */
passport.use('pinterest', new OAuth2Strategy({
  authorizationURL: 'https://api.pinterest.com/oauth/',
  tokenURL: 'https://api.pinterest.com/v1/oauth/token',
  clientID: process.env.PINTEREST_ID,
  clientSecret: process.env.PINTEREST_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/pinterest/callback`,
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const user = await User.findOne(req.user._id);
    user.tokens.push({ kind: 'pinterest', accessToken });
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/**
 * Intuit/QuickBooks API OAuth.
 */
const quickbooksStrategyConfig = new OAuth2Strategy({
  authorizationURL: 'https://appcenter.intuit.com/connect/oauth2',
  tokenURL: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  clientID: process.env.QUICKBOOKS_CLIENT_ID,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/quickbooks/callback`,
  passReqToCallback: true,
},
async (req, accessToken, refreshToken, params, profile, done) => {
  try {
    const user = await User.findById(req.user._id);
    user.quickbooks = req.query.realmId;
    const quickbooksToken = user.tokens.find((vendor) => vendor.kind === 'quickbooks');
    if (quickbooksToken) {
      quickbooksToken.accessToken = accessToken;
      quickbooksToken.accessTokenExpires = moment().add(params.expires_in, 'seconds').format();
      quickbooksToken.refreshToken = refreshToken;
      quickbooksToken.refreshTokenExpires = moment().add(params.x_refresh_token_expires_in, 'seconds').format();
      if (params.expires_in) quickbooksToken.accessTokenExpires = moment().add(params.expires_in, 'seconds').format();
    } else {
      user.tokens.push({
        kind: 'quickbooks',
        accessToken,
        accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
        refreshToken,
        refreshTokenExpires: moment().add(params.x_refresh_token_expires_in, 'seconds').format(),
      });
    }
    user.markModified('tokens');
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});
passport.use('quickbooks', quickbooksStrategyConfig);
refresh.use('quickbooks', quickbooksStrategyConfig);

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = async (req, res, next) => {
  const provider = req.path.split('/')[2];
  const token = req.user.tokens.find((token) => token.kind === provider);
  if (token) {
    if (token.accessTokenExpires && moment(token.accessTokenExpires).isBefore(moment().subtract(1, 'minutes'))) {
      if (token.refreshToken) {
        if (token.refreshTokenExpires && moment(token.refreshTokenExpires).isBefore(moment().subtract(1, 'minutes'))) {
          return res.redirect(`/auth/${provider}`);
        }
        try {
          const newTokens = await new Promise((resolve, reject) => {
            refresh.requestNewAccessToken(`${provider}`, token.refreshToken, (err, accessToken, refreshToken, params) => {
              if (err) reject(err);
              resolve({ accessToken, refreshToken, params });
            });
          });

          req.user.tokens.forEach((tokenObject) => {
            if (tokenObject.kind === provider) {
              tokenObject.accessToken = newTokens.accessToken;
              if (newTokens.params.expires_in) tokenObject.accessTokenExpires = moment().add(newTokens.params.expires_in, 'seconds').format();
            }
          });

          await req.user.save();
          return next();
        } catch (err) {
          console.log(err);
          return next();
        }
      } else {
        return res.redirect(`/auth/${provider}`);
      }
    } else {
      return next();
    }
  } else {
    return res.redirect(`/auth/${provider}`);
  }
};
