const crypto = require('crypto');
const passport = require('passport');
const refresh = require('passport-oauth2-refresh');
const axios = require('axios');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: TwitterStrategy } = require('@passport-js/passport-twitter');
const { Strategy: TwitchStrategy } = require('twitch-passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const { SteamOpenIdStrategy } = require('passport-steam-openid');
const { OAuthStrategy } = require('passport-oauth');
const { OAuth2Strategy } = require('passport-oauth');
const OpenIDConnectStrategy = require('passport-openidconnect');
const { OAuth } = require('oauth');
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

function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: { $eq: email.toLowerCase() } })
      .then((user) => {
        if (!user) {
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        if (!user.password) {
          return done(null, false, {
            msg: 'Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.',
          });
        }
        user.comparePassword(password, (err, isMatch) => {
          if (err) {
            return done(err);
          }
          if (isMatch) {
            return done(null, user);
          }
          return done(null, false, { msg: 'Invalid email or password.' });
        });
      })
      .catch((err) => done(err));
  }),
);

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
 * Common function to handle OAuth2 token processing and saving user data.
 *
 * This function is to handle various senarious that we would run into when it comes to
 * processing the OAuth2 tokens and saving the user data.
 *
 * If we have an existing tokens:
 *    - Updates the access token
 *    - Updates access token expiration if provided
 *    - Updates refresh token if provided
 *    - Updates refresh token expiration if provided
 *    - Removes expiration dates if new tokens don't have them
 *
 * If no tokens exists:
 *    - Creates new token entry with provided tokens and expirations
 */
async function saveOAuth2UserTokens(req, accessToken, refreshToken, accessTokenExpiration, refreshTokenExpiration, providerName, tokenConfig = {}) {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      // If user is not found in DB, use the one from the request because we are creating a new user
      user = req.user;
    }
    const providerToken = user.tokens.find((token) => token.kind === providerName);
    if (providerToken) {
      providerToken.accessToken = accessToken;
      if (accessTokenExpiration) {
        providerToken.accessTokenExpires = moment().add(accessTokenExpiration, 'seconds').format();
      } else {
        delete providerToken.accessTokenExpires;
      }
      if (refreshToken) {
        providerToken.refreshToken = refreshToken;
      }
      if (refreshTokenExpiration) {
        providerToken.refreshTokenExpires = moment().add(refreshTokenExpiration, 'seconds').format();
      } else if (refreshToken) {
        // Only delete refresh token expiration if we got a new refresh token and don't have an expiration for it
        delete providerToken.refreshTokenExpires;
      }
    } else {
      const newToken = {
        kind: providerName,
        accessToken,
        ...(accessTokenExpiration && {
          accessTokenExpires: moment().add(accessTokenExpiration, 'seconds').format(),
        }),
        ...(refreshToken && { refreshToken }),
        ...(refreshTokenExpiration && {
          refreshTokenExpires: moment().add(refreshTokenExpiration, 'seconds').format(),
        }),
      };
      user.tokens.push(newToken);
    }

    if (tokenConfig) {
      Object.assign(user, tokenConfig);
    }

    user.markModified('tokens');
    await user.save();
    return user;
  } catch (err) {
    throw new Error(err);
  }
}

/**
 * Sign in with Facebook.
 */
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
      profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
      state: generateState(),
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, params, profile, done) => {
      // Facebook does not provide a refresh token but includes an expiration for the access token
      try {
        if (req.user) {
          const existingUser = await User.findOne({
            facebook: { $eq: profile.id },
          });
          if (existingUser) {
            req.flash('errors', {
              msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
            });
            return done(null, existingUser);
          }
          const user = await saveOAuth2UserTokens(req, accessToken, null, params.expires_in, null, 'facebook');
          user.facebook = profile.id;
          user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
          await user.save();
          req.flash('info', { msg: 'Facebook account has been linked.' });
          return done(null, user);
        }
        const existingUser = await User.findOne({
          facebook: { $eq: profile.id },
        });
        if (existingUser) {
          return done(null, existingUser);
        }
        const existingEmailUser = await User.findOne({
          email: { $eq: profile._json.email },
        });
        if (existingEmailUser) {
          req.flash('errors', {
            msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.',
          });
          return done(null, existingEmailUser);
        }
        const user = new User();
        user.email = profile._json.email;
        user.facebook = profile.id;
        req.user = user;
        await saveOAuth2UserTokens(req, accessToken, null, params.expires_in, null, 'facebook');
        user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
        user.profile.gender = profile._json.gender;
        user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
        user.profile.location = profile._json.location ? profile._json.location.name : '';
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

/**
 * Sign in with GitHub.
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
      state: generateState(),
      passReqToCallback: true,
      scope: ['user:email'],
    },
    async (req, accessToken, refreshToken, params, profile, done) => {
      // GitHub does not provide a refresh token or an expiration
      try {
        if (req.user) {
          const existingUser = await User.findOne({
            github: { $eq: profile.id },
          });
          if (existingUser) {
            req.flash('errors', {
              msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
            });
            return done(null, existingUser);
          }
          const user = await saveOAuth2UserTokens(req, accessToken, null, null, null, 'github');
          user.github = profile.id;
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.avatar_url;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.website = user.profile.website || profile._json.blog;
          await user.save();
          req.flash('info', { msg: 'GitHub account has been linked.' });
          return done(null, user);
        }
        const existingUser = await User.findOne({
          github: { $eq: profile.id },
        });
        if (existingUser) {
          return done(null, existingUser);
        }
        const emailValue = _.get(_.orderBy(profile.emails, ['primary', 'verified'], ['desc', 'desc']), [0, 'value'], null);
        if (profile._json.email === null) {
          const existingEmailUser = await User.findOne({
            email: { $eq: emailValue },
          });

          if (existingEmailUser) {
            req.flash('errors', {
              msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.',
            });
            return done(null, existingEmailUser);
          }
        } else {
          const existingEmailUser = await User.findOne({
            email: { $eq: profile._json.email },
          });
          if (existingEmailUser) {
            req.flash('errors', {
              msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.',
            });
            return done(null, existingEmailUser);
          }
        }
        const user = new User();
        user.email = emailValue;
        user.github = profile.id;
        req.user = user;
        await saveOAuth2UserTokens(req, accessToken, null, null, null, 'github');
        user.profile.name = profile.displayName;
        user.profile.picture = profile._json.avatar_url;
        user.profile.location = profile._json.location;
        user.profile.website = profile._json.blog;
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

/**
 * Sign in with X.
 */
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.X_KEY,
      consumerSecret: process.env.X_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/x/callback`,
      state: generateState(),
      passReqToCallback: true,
    },
    async (req, accessToken, tokenSecret, profile, done) => {
      try {
        if (req.user) {
          const existingUser = await User.findOne({ x: { $eq: profile.id } });
          if (existingUser) {
            req.flash('errors', {
              msg: 'There is already a X account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
            });
            return done(null, existingUser);
          }
          const user = await User.findById(req.user.id);
          user.x = profile.id;
          user.tokens.push({ kind: 'x', accessToken, tokenSecret });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
          await user.save();
          req.flash('info', { msg: 'X account has been linked.' });
          return done(null, user);
        }
        const existingUser = await User.findOne({ x: { $eq: profile.id } });
        if (existingUser) {
          return done(null, existingUser);
        }
        const user = new User();
        // X will not provide an email address.  Period.
        // But a person’s X username is guaranteed to be unique
        // so we can "fake" a X email address as follows:
        user.email = `${profile.username}@x.com`;
        user.x = profile.id;
        user.tokens.push({ kind: 'x', accessToken, tokenSecret });
        user.profile.name = profile.displayName;
        user.profile.location = profile._json.location;
        user.profile.picture = profile._json.profile_image_url_https;
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

/**
 * Sign in with Google.
 */
const googleStrategyConfig = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
    accessType: 'offline',
    prompt: 'consent',
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      if (req.user) {
        const existingUser = await User.findOne({
          google: { $eq: profile.id },
        });
        if (existingUser && existingUser.id !== req.user.id) {
          req.flash('errors', {
            msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
          });
          return done(null, existingUser);
        }
        const user = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, null, 'google');
        user.google = profile.id;
        user.profile.name = user.profile.name || profile.displayName;
        user.profile.gender = user.profile.gender || profile._json.gender;
        user.profile.picture = user.profile.picture || profile._json.picture;
        await user.save();
        req.flash('info', { msg: 'Google account has been linked.' });
        return done(null, user);
      }
      const existingUser = await User.findOne({ google: { $eq: profile.id } });
      if (existingUser) {
        return done(null, existingUser);
      }
      const existingEmailUser = await User.findOne({
        email: { $eq: profile.emails[0].value },
      });
      if (existingEmailUser) {
        req.flash('errors', {
          msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.',
        });
        return done(null, existingEmailUser);
      }
      const user = new User();
      user.email = profile.emails[0].value;
      user.google = profile.id;
      req.user = user; // Set req.user so saveOAuth2UserTokens can use it
      await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, null, 'google');
      user.profile.name = profile.displayName;
      user.profile.gender = profile._json.gender;
      user.profile.picture = profile._json.picture;
      await user.save();
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('google', googleStrategyConfig);
refresh.use('google', googleStrategyConfig);

/**
 * Sign in with LinkedIn using OpenID Connect.
 */
passport.use(
  'linkedin',
  new OpenIDConnectStrategy(
    {
      issuer: 'https://www.linkedin.com/oauth',
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoURL: 'https://api.linkedin.com/v2/userinfo',
      clientID: process.env.LINKEDIN_ID,
      clientSecret: process.env.LINKEDIN_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: true,
    },
    async (req, issuer, profile, params, done) => {
      try {
        if (!profile || !profile.id) {
          return done(null, false, {
            message: 'No profile information received.',
          });
        }
        if (req.user) {
          const existingUser = await User.findOne({
            linkedin: { $eq: profile.id },
          });
          if (existingUser) {
            req.flash('errors', {
              msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
            });
            return done(null, existingUser);
          }
          const user = await User.findById(req.user.id);
          user.linkedin = profile.id;
          user.tokens.push({ kind: 'linkedin', accessToken: null }); // null for now since passport-openidconnect isn't returning it yet; will update when it supports it
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile.photos;
          await user.save();
          req.flash('info', { msg: 'LinkedIn account has been linked.' });
          return done(null, user);
        }
        const existingUser = await User.findOne({
          linkedin: { $eq: profile.id },
        });
        if (existingUser) {
          return done(null, existingUser);
        }
        const email = profile.emails && profile.emails[0] && profile.emails[0].value ? profile.emails[0].value : undefined;
        const existingEmailUser = await User.findOne({ email: { $eq: email } });

        if (existingEmailUser) {
          req.flash('errors', {
            msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.',
          });
          return done(null, existingEmailUser);
        }
        const user = new User();
        user.linkedin = profile.id;
        user.tokens.push({ kind: 'linkedin', accessToken: null });
        user.email = email;
        user.profile.name = profile.displayName;
        user.profile.picture = profile.photos || '';
        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

/**
 * Twitch API OAuth.
 */
const twitchStrategyConfig = new TwitchStrategy(
  {
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/twitch/callback`,
    scope: ['user:read:email', 'channel:read:subscriptions', 'moderator:read:followers'],
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      if (req.user) {
        const existingUser = await User.findOne({
          twitch: { $eq: profile.id },
        });
        if (existingUser && existingUser.id !== req.user.id) {
          req.flash('errors', {
            msg: 'There is already a Twitch account that belongs to you. Sign in with that account or delete it, then link it with your current account.',
          });
          return done(null, existingUser);
        }
        const user = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, null, 'twitch');
        user.twitch = profile.id;
        user.profile.name = user.profile.name || profile.display_name;
        user.profile.email = user.profile.gender || profile.email;
        user.profile.picture = user.profile.picture || profile.profile_image_url;
        await user.save();
        req.flash('info', { msg: 'Twitch account has been linked.' });
        return done(null, user);
      }
      const existingUser = await User.findOne({ twitch: { $eq: profile.id } });
      if (existingUser) {
        return done(null, existingUser);
      }
      const existingEmailUser = await User.findOne({
        email: { $eq: profile.email },
      });
      if (existingEmailUser) {
        req.flash('errors', {
          msg: 'There is already an account using this email address. Sign in to that account and link it with Twitch manually from Account Settings.',
        });
        return done(null, existingEmailUser);
      }
      const user = new User();
      user.email = profile.email;
      user.twitch = profile.id;
      req.user = user; // Set req.user so saveOAuth2UserTokens can use it
      await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, null, 'twitch');
      user.profile.name = profile.display_name;
      user.profile.email = profile.email;
      user.profile.picture = profile.profile_image_url;
      await user.save();
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('twitch', twitchStrategyConfig);
refresh.use('twitch', twitchStrategyConfig);

/**
 * Tumblr API OAuth.
 */
passport.use(
  'tumblr',
  new OAuthStrategy(
    {
      requestTokenURL: 'https://www.tumblr.com/oauth/request_token',
      accessTokenURL: 'https://www.tumblr.com/oauth/access_token',
      userAuthorizationURL: 'https://www.tumblr.com/oauth/authorize',
      consumerKey: process.env.TUMBLR_KEY,
      consumerSecret: process.env.TUMBLR_SECRET,
      callbackURL: '/auth/tumblr/callback',
      state: generateState(),
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, done) => {
      try {
        const user = await User.findById(req.user._id);

        if (!token || !tokenSecret) {
          throw new Error('Missing or invalid token/tokenSecret');
        }

        // Helper function to generate the OAuth 1.0a authHeader for Tumblr API.
        // This function is not going to make any actual calls to
        // tumblr's /request_token or /access_token endpoints.
        function getTumblrAuthHeader(url, method) {
          const oauth = new OAuth('https://www.tumblr.com/oauth/request_token', 'https://www.tumblr.com/oauth/access_token', process.env.TUMBLR_KEY, process.env.TUMBLR_SECRET, '1.0A', null, 'HMAC-SHA1');
          return oauth.authHeader(url, token, tokenSecret, method);
        }

        const userInfoURL = 'https://api.tumblr.com/v2/user/info';
        const response = await axios.get(userInfoURL, {
          headers: { Authorization: getTumblrAuthHeader(userInfoURL, 'GET') },
        });

        // Extract user info from the API response
        const tumblrUser = response.data.response.user;
        if (!user.tumblr) {
          user.tumblr = tumblrUser.name; // Save Tumblr username
        }

        // Save tokens and user info
        user.tokens.push({ kind: 'tumblr', accessToken: token, tokenSecret });
        await user.save();

        return done(null, user);
      } catch (err) {
        if (err.response) {
          // Log API response error details for debugging
          console.error('Tumblr API Error:', {
            status: err.response.status,
            headers: err.response.headers,
            data: err.response.data,
          });
        } else {
          console.error('Unexpected Error:', err.message);
        }
        return done(err);
      }
    },
  ),
);

/**
 * Steam API OpenID.
 */
passport.use(
  new SteamOpenIdStrategy(
    {
      apiKey: process.env.STEAM_KEY,
      returnURL: `${process.env.BASE_URL}/auth/steam/callback`,
      profile: true,
      state: generateState(),
    },
    async (req, identifier, profile, done) => {
      const steamId = identifier.match(/\d+$/)[0];
      const profileURL = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_KEY}&steamids=${steamId}`;
      try {
        if (req.user) {
          const existingUser = await User.findOne({ steam: { $eq: steamId } });
          if (existingUser) {
            req.flash('errors', {
              msg: 'There is already an account associated with the SteamID. Sign in with that account or delete it, then link it with your current account.',
            });
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
    },
  ),
);

/**
 * Pinterest API OAuth.
 */
const pinterestStrategyConfig = new OAuth2Strategy(
  {
    authorizationURL: 'https://www.pinterest.com/oauth',
    tokenURL: 'https://api.pinterest.com/v5/oauth/token',
    clientID: process.env.PINTEREST_ID,
    clientSecret: process.env.PINTEREST_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/pinterest/callback`,
    passReqToCallback: true,
    state: generateState(),
    scope: ['user_accounts:read', 'pins:read', 'pins:write', 'boards:read'],
    customHeaders: {
      Authorization: `Basic ${Buffer.from(`${process.env.PINTEREST_ID}:${process.env.PINTEREST_SECRET}`).toString('base64')}`,
    },
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user.pinterest) {
        const pinterestUserResponse = await axios.get('https://api.pinterest.com/v5/user_account', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const pinterestUser = pinterestUserResponse.data;
        user.pinterest = pinterestUser.id;
        if (pinterestUser.website_url) {
          user.profile.website = pinterestUser.website_url;
        }
        if (
          !user.profile.picture &&
          // && pinterestUser.account_type === 'PINNER'
          pinterestUser.profile_image &&
          !pinterestUser.profile_image.includes('default')
        ) {
          user.profile.picture = pinterestUser.profile_image;
        }
      }
      const updatedUser = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, params.refresh_token_expires_in, 'pinterest');
      await user.save();
      return done(null, updatedUser);
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('pinterest', pinterestStrategyConfig);
refresh.use('pinterest', pinterestStrategyConfig);

/**
 * Intuit/QuickBooks API OAuth.
 */
const quickbooksStrategyConfig = new OAuth2Strategy(
  {
    authorizationURL: 'https://appcenter.intuit.com/connect/oauth2',
    tokenURL: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    clientID: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/quickbooks/callback`,
    scope: ['com.intuit.quickbooks.accounting'],
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      const user = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, params.x_refresh_token_expires_in, 'quickbooks', {
        quickbooks: req.query.realmId,
      });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  },
);
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
          return res.redirect(`/auth/${provider}`);
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

// Add export for testing the internal function
exports._saveOAuth2UserTokens = saveOAuth2UserTokens;
