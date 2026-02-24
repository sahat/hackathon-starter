const crypto = require('node:crypto');
const passport = require('passport');
const refresh = require('passport-oauth2-refresh');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: TwitterStrategy } = require('@passport-js/passport-twitter');
const { Strategy: TwitchStrategy } = require('twitch-passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const { SteamOpenIdStrategy } = require('passport-steam-openid');
const { OAuthStrategy } = require('passport-oauth');
const { OAuth2Strategy } = require('passport-oauth');
const { OAuth } = require('oauth');
const validator = require('validator');

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
            msg: 'Your account was created with a sign-in provider. You can log in using the provider or an email link. To enable email and password login, set a new password in your profile settings.',
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
 * Helper function that contains the shared post-profile OAuth logic
 * (supports OAuth 1.0a and OAuth 2.0 providers).
 * Returns User (new or updated) on success or throws Error on failure.
 */
async function handleAuthLogin(req, accessToken, refreshToken, providerName, params, providerProfile, sessionAlreadyLoggedIn, tokenSecret, oauth2provider, tokenConfig = {}, refreshTokenExpiration = null) {
  if (sessionAlreadyLoggedIn) {
    const existingUser = await User.findOne({
      [providerName]: { $eq: providerProfile.id },
    });
    if (existingUser && existingUser.id !== req.user.id) {
      throw new Error('PROVIDER_COLLISION');
    }
    let user;
    if (oauth2provider) {
      user = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, refreshTokenExpiration, providerName, tokenConfig);
    } else {
      user = await User.findById(req.user.id);
      user.tokens.push({ kind: providerName, accessToken, ...(tokenSecret && { tokenSecret }) });
    }
    user[providerName] = providerProfile.id;
    user.profile.name = user.profile.name || providerProfile.name;
    user.profile.gender = user.profile.gender || providerProfile.gender;

    if (providerProfile.picture) {
      if (!user.profile.pictures || user.profile.pictureSource === undefined) {
        // legacy account (pre-multi-picture support)
        user.profile.pictures = new Map();
        user.profile.picture = providerProfile.picture;
        user.profile.pictureSource = providerName;
      }
      user.profile.pictures.set(providerName, providerProfile.picture);
      if (user.profile.pictureSource === 'gravatar') {
        user.profile.picture = providerProfile.picture;
        user.profile.pictureSource = providerName;
      }
    }

    user.profile.location = user.profile.location || providerProfile.location;
    user.profile.website = user.profile.website || providerProfile.website;
    user.profile.email = user.profile.email || providerProfile.email;
    await user.save();
    return user;
  }
  // User is not logged in:
  const existingUser = await User.findOne({ [providerName]: { $eq: providerProfile.id } });
  if (existingUser) {
    return existingUser;
  }
  const normalizedEmail = providerProfile.email ? validator.normalizeEmail(providerProfile.email, { gmail_remove_dots: false }) : undefined;
  if (!normalizedEmail) {
    throw new Error('EMAIL_REQUIRED');
  }
  const existingEmailUser = await User.findOne({
    email: { $eq: normalizedEmail },
  });
  if (existingEmailUser) {
    throw new Error('EMAIL_COLLISION');
  }
  const user = new User();
  user.email = normalizedEmail;
  user[providerName] = providerProfile.id;
  req.user = user;
  if (oauth2provider) {
    await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, refreshTokenExpiration, providerName, tokenConfig);
  } else {
    user.tokens.push({ kind: providerName, accessToken, ...(tokenSecret && { tokenSecret }) });
  }
  user.profile.name = providerProfile.name;
  user.profile.gender = providerProfile.gender;

  if (providerProfile.picture) {
    user.profile.pictures = new Map();
    user.profile.pictures.set(providerName, providerProfile.picture);
    user.profile.picture = providerProfile.picture;
    user.profile.pictureSource = providerName;
  }

  user.profile.location = providerProfile.location;
  user.profile.website = providerProfile.website;
  user.profile.email = providerProfile.email;
  await user.save();
  return user;
}

/**
 * Helper function to handle OAuth errors with provider-specific messages.
 * Returns true if error was handled, false otherwise.
 */
function authError2Flash(err, req, done, providerDisplayName) {
  if (err.message === 'PROVIDER_COLLISION') {
    req.flash('errors', { msg: `There is another account in our system linked to your ${providerDisplayName} account. Please delete the duplicate account before linking ${providerDisplayName} to your current account.` });
    if (req.session) req.session.returnTo = undefined;
    done(null, req.user);
    return true;
  }
  if (err.message === 'EMAIL_COLLISION') {
    req.flash('errors', { msg: `Unable to sign in with ${providerDisplayName} at this time. If you have an existing account in our system, please sign in by email and link your account to ${providerDisplayName} in your user profile settings.` });
    done(null, false);
    return true;
  }
  if (err.message === 'EMAIL_REQUIRED') {
    req.flash('errors', { msg: `Unable to sign in with ${providerDisplayName}. No email address was provided for account creation.` });
    done(null, false);
    return true;
  }
  return false;
}

/**
 * Common function to handle OAuth2 token processing and saving user data.
 *
 * This function is to handle various scenarios that we would run into when it comes to
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
      ({ user } = req);
    }
    const providerToken = user.tokens.find((token) => token.kind === providerName);
    if (providerToken) {
      providerToken.accessToken = accessToken;
      if (accessTokenExpiration) {
        providerToken.accessTokenExpires = new Date(Date.now() + accessTokenExpiration * 1000).toISOString();
      } else {
        delete providerToken.accessTokenExpires;
      }
      if (refreshToken) {
        providerToken.refreshToken = refreshToken;
      }
      if (refreshTokenExpiration) {
        providerToken.refreshTokenExpires = new Date(Date.now() + refreshTokenExpiration * 1000).toISOString();
      } else if (refreshToken) {
        // Only delete refresh token expiration if we got a new refresh token and don't have an expiration for it
        delete providerToken.refreshTokenExpires;
      }
    } else {
      const newToken = {
        kind: providerName,
        accessToken,
        ...(accessTokenExpiration && {
          accessTokenExpires: new Date(Date.now() + accessTokenExpiration * 1000).toISOString(),
        }),
        ...(refreshToken && { refreshToken }),
        ...(refreshTokenExpiration && {
          refreshTokenExpires: new Date(Date.now() + refreshTokenExpiration * 1000).toISOString(),
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

FacebookStrategy.prototype.authorizationParams = function () {
  return { auth_type: 'rerequest' };
};

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
      profileFields: ['name', 'email', 'link', 'locale', 'timezone', 'gender'],
      scope: ['public_profile', 'email'],
      state: generateState(),
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, params, profile, done) => {
      // Facebook does not provide a refresh token but includes an expiration for the access token
      try {
        const providerProfile = {
          id: profile.id,
          name: `${profile.name.givenName} ${profile.name.familyName}`,
          gender: profile._json.gender,
          picture: `https://graph.facebook.com/${profile.id}/picture?type=large`,
          location: profile._json.location ? profile._json.location.name : '',
          email: profile._json.email,
        };
        try {
          const sessionAlreadyLoggedIn = !!req.user;
          const user = await handleAuthLogin(req, accessToken, null, 'facebook', params, providerProfile, sessionAlreadyLoggedIn, null, true);
          if (sessionAlreadyLoggedIn && req.user.id === user.id) {
            req.flash('info', { msg: 'Facebook account has been linked.' });
          }
          return done(null, user);
        } catch (err) {
          if (authError2Flash(err, req, done, 'Facebook')) return;
          throw err;
        }
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
        // Github may return a list of email addresses instead of just one
        // Sort by primary, then by verified, then pick the first one in the list
        const sortedEmails = (profile.emails || []).slice().sort((a, b) => {
          if (b.primary !== a.primary) return b.primary - a.primary;
          if (b.verified !== a.verified) return b.verified - a.verified;
          return 0;
        });
        const providerProfile = {
          id: profile.id,
          name: profile.displayName,
          picture: profile._json.avatar_url,
          location: profile._json.location,
          website: profile._json.blog,
          email: sortedEmails.length > 0 ? sortedEmails[0].value : null,
        };
        try {
          const sessionAlreadyLoggedIn = !!req.user;
          const user = await handleAuthLogin(req, accessToken, null, 'github', params, providerProfile, sessionAlreadyLoggedIn, null, true);
          if (sessionAlreadyLoggedIn && req.user.id === user.id) {
            req.flash('info', { msg: 'GitHub account has been linked.' });
          }
          return done(null, user);
        } catch (err) {
          if (authError2Flash(err, req, done, 'GitHub')) return;
          throw err;
        }
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
        // X will not provide an email address.  Period.
        // But a person's X username is guaranteed to be unique
        // so we can "fake" placeholder X email address as follows:
        const providerProfile = {
          id: profile.id,
          name: profile.displayName,
          location: profile._json.location,
          picture: profile._json.profile_image_url_https,
          email: `${profile.username}@placeholder-x.email`,
        };
        try {
          const sessionAlreadyLoggedIn = !!req.user;
          const user = await handleAuthLogin(req, accessToken, null, 'x', {}, providerProfile, sessionAlreadyLoggedIn, tokenSecret, false);
          if (sessionAlreadyLoggedIn && req.user.id === user.id) {
            req.flash('info', { msg: 'X account has been linked.' });
          }
          return done(null, user);
        } catch (err) {
          if (authError2Flash(err, req, done, 'X')) return;
          throw err;
        }
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
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
    accessType: 'offline',
    prompt: 'consent',
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      const providerProfile = {
        id: profile.id,
        name: profile.displayName,
        gender: profile._json.gender,
        picture: profile._json.picture,
        email: profile.emails && profile.emails[0] && profile.emails[0].value ? profile.emails[0].value : undefined,
      };
      try {
        const sessionAlreadyLoggedIn = !!req.user;
        const user = await handleAuthLogin(req, accessToken, refreshToken, 'google', params, providerProfile, sessionAlreadyLoggedIn, null, true);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'Google account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'Google')) return;
        throw err;
      }
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('google', googleStrategyConfig);
refresh.use('google', googleStrategyConfig);

/**
 * Sign in with LinkedIn using OAuth2.
 */
const linkedinStrategyConfig = new OAuth2Strategy(
  {
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: process.env.LINKEDIN_ID,
    clientSecret: process.env.LINKEDIN_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
    scope: ['openid', 'profile', 'email'].join(' '),
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    const sessionAlreadyLoggedIn = !!req.user;
    try {
      // Fetch LinkedIn profile using accessToken
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return done(new Error('Failed to fetch LinkedIn profile'));
      }
      const linkedinProfile = await response.json();
      if (!linkedinProfile || !linkedinProfile.sub || !linkedinProfile.name) {
        req.flash('errors', { msg: 'Invalid LinkedIn profile data' });
        return sessionAlreadyLoggedIn ? done(null, req.user) : done(null, false);
      }
      const providerProfile = {
        id: linkedinProfile.sub,
        name: linkedinProfile.name,
        picture: linkedinProfile.picture || undefined,
        email: linkedinProfile.email,
      };
      try {
        const user = await handleAuthLogin(req, accessToken, refreshToken, 'linkedin', params, providerProfile, sessionAlreadyLoggedIn, null, true);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'LinkedIn account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'LinkedIn')) return;
        throw err;
      }
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('linkedin', linkedinStrategyConfig);
refresh.use('linkedin', linkedinStrategyConfig);

/**
 * Sign in with Microsoft using OAuth2Strategy.
 */
const microsoftStrategyConfig = new OAuth2Strategy(
  {
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/microsoft/callback`,
    // Note: To get a refresh token, add 'offline_access' to the scope list.
    // Trade-off: Users will see a permission approval screen every time they login with 'offline_access' in scope.
    scope: ['openid', 'profile', 'email', 'User.Read'].join(' '),
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    const sessionAlreadyLoggedIn = !!req.user;
    try {
      // Fetch Microsoft profile using accessToken
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return done(new Error('Failed to fetch Microsoft profile'));
      }
      const microsoftProfile = await response.json();
      if (!microsoftProfile || !microsoftProfile.id || !microsoftProfile.displayName) {
        req.flash('errors', { msg: 'Invalid Microsoft profile data' });
        return sessionAlreadyLoggedIn ? done(null, req.user) : done(null, false);
      }
      const providerProfile = {
        id: microsoftProfile.id,
        name: microsoftProfile.displayName,
        email: microsoftProfile.mail || microsoftProfile.userPrincipalName,
      };
      try {
        const user = await handleAuthLogin(req, accessToken, refreshToken, 'microsoft', params, providerProfile, sessionAlreadyLoggedIn, null, true, {}, params.refresh_token_expires_in);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'Microsoft account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'Microsoft')) return;
        throw err;
      }
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('microsoft', microsoftStrategyConfig);
refresh.use('microsoft', microsoftStrategyConfig);

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
      const providerProfile = {
        id: profile.id,
        name: profile.display_name,
        email: profile?._json?.data?.[0]?.email ?? profile?.email ?? null,
        picture: profile.profile_image_url,
      };
      try {
        const sessionAlreadyLoggedIn = !!req.user;
        const user = await handleAuthLogin(req, accessToken, refreshToken, 'twitch', params, providerProfile, sessionAlreadyLoggedIn, null, true);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'Twitch account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'Twitch')) return;
        throw err;
      }
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
        const response = await fetch(userInfoURL, { headers: { Authorization: getTumblrAuthHeader(userInfoURL, 'GET') } });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Extract user info from the API response
        const tumblrUser = data.response.user;
        const primaryBlog = tumblrUser.blogs?.find((blog) => blog.primary) || tumblrUser.blogs?.[0];
        const providerProfile = {
          id: primaryBlog.uuid || tumblrUser.name,
          name: tumblrUser.name,
          picture: primaryBlog?.avatar?.[0]?.url,
          website: primaryBlog?.url,
        };
        try {
          const sessionAlreadyLoggedIn = !!req.user;
          const user = await handleAuthLogin(req, token, null, 'tumblr', {}, providerProfile, sessionAlreadyLoggedIn, tokenSecret, false);
          if (sessionAlreadyLoggedIn && req.user.id === user.id) {
            req.flash('info', { msg: 'Tumblr account has been linked.' });
          }
          return done(null, user);
        } catch (err) {
          if (authError2Flash(err, req, done, 'Tumblr')) return;
          throw err;
        }
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
      const sessionAlreadyLoggedIn = !!req.user;
      // Fetch Steam profile data
      let providerProfile;
      try {
        const response = await fetch(profileURL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const players = data && data.response && Array.isArray(data.response.players) ? data.response.players : [];
        if (players.length === 0) {
          req.flash('errors', { msg: 'Invalid Steam profile data' });
          return sessionAlreadyLoggedIn ? done(null, req.user) : done(null, false);
        }
        providerProfile = {
          id: steamId,
          name: data.response.players[0].personaname,
          picture: data.response.players[0].avatarmedium,
        };
      } catch (err) {
        console.log(err);
        return done(err);
      }

      try {
        const user = await handleAuthLogin(req, steamId, null, 'steam', {}, providerProfile, sessionAlreadyLoggedIn, null, false);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'Steam account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'Steam')) return;
        return done(err);
      }
    },
  ),
);

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
      const user = await saveOAuth2UserTokens(req, accessToken, refreshToken, params.expires_in, params.x_refresh_token_expires_in, 'quickbooks', { quickbooks: req.query.realmId });
      req.flash('info', { msg: 'Quickbooks account has been linked.' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('quickbooks', quickbooksStrategyConfig);
refresh.use('quickbooks', quickbooksStrategyConfig);

/**
 * trakt.tv API OAuth.
 */
const traktStrategyConfig = new OAuth2Strategy(
  {
    authorizationURL: 'https://api.trakt.tv/oauth/authorize',
    tokenURL: 'https://api.trakt.tv/oauth/token',
    clientID: process.env.TRAKT_ID,
    clientSecret: process.env.TRAKT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/trakt/callback`,
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    try {
      const response = await fetch('https://api.trakt.tv/users/me?extended=full', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'trakt-api-version': 2,
          'trakt-api-key': process.env.TRAKT_ID,
          'Content-Type': 'application/json',
          'User-Agent': 'Hackathon-Starter',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data?.ids?.slug || !data?.name) {
        req.flash('errors', { msg: 'Invalid Trakt profile data' });
        return req.user ? done(null, req.user) : done(null, false);
      }
      const providerProfile = {
        id: data.ids.slug,
        name: data.name,
        gender: data.gender,
        picture: data.images?.avatar?.full,
        location: data.location,
      };
      const sessionAlreadyLoggedIn = !!req.user;
      try {
        const user = await handleAuthLogin(req, accessToken, refreshToken, 'trakt', params, providerProfile, sessionAlreadyLoggedIn, null, true, { trakt: data.ids.slug }, params.x_refresh_token_expires_in || null);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'Trakt account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'Trakt')) return;
        return done(err);
      }
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('trakt', traktStrategyConfig);
refresh.use('trakt', traktStrategyConfig);

/**
 * Sign in with Discord using OAuth2Strategy.
 */
const discordStrategyConfig = new OAuth2Strategy(
  {
    authorizationURL: 'https://discord.com/api/oauth2/authorize',
    tokenURL: 'https://discord.com/api/oauth2/token',
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/discord/callback`,
    scope: ['identify', 'email'].join(' '),
    state: generateState(),
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    const sessionAlreadyLoggedIn = !!req.user;
    try {
      // Fetch Discord profile using accessToken
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        return done(new Error('Failed to fetch Discord profile'));
      }
      const discordProfile = await response.json();
      if (!discordProfile || !discordProfile.id || !discordProfile.username) {
        req.flash('errors', { msg: 'Invalid Discord profile data' });
        return sessionAlreadyLoggedIn ? done(null, req.user) : done(null, false);
      }
      const providerProfile = {
        id: discordProfile.id,
        name: discordProfile.username,
        email: discordProfile.email,
        picture: discordProfile.avatar ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png` : undefined,
      };
      try {
        const user = await handleAuthLogin(req, accessToken, refreshToken, 'discord', params, providerProfile, sessionAlreadyLoggedIn, null, true);
        if (sessionAlreadyLoggedIn && req.user.id === user.id) {
          req.flash('info', { msg: 'Discord account has been linked.' });
        }
        return done(null, user);
      } catch (err) {
        if (authError2Flash(err, req, done, 'Discord')) return;
        throw err;
      }
    } catch (err) {
      return done(err);
    }
  },
);
passport.use('discord', discordStrategyConfig);
refresh.use('discord', discordStrategyConfig);

/**
 * Token Revocation Config
 *
 * Providers with a revocation endpoint. Used by config/token-revocation.js
 * to revoke tokens on unlink or account deletion.
 *
 * authMethod values:
 *   'body'           – client_id + client_secret + token in form-encoded body
 *   'basic'          – HTTP Basic auth (client_id:client_secret) + token in form body
 *   'token_only'     – only the token in form-encoded body
 *   'client_id_only' – client_id + token in body (no client_secret)
 *   'json_body'      – JSON body with token, client_id, client_secret
 *   'trakt'          – JSON body + trakt-api-key / trakt-api-version headers
 *   'facebook'       – HTTP DELETE with access_token as query param
 *   'github'         – HTTP DELETE with Basic auth + JSON body
 *   'oauth1'         – OAuth 1.0a signed POST (needs consumerKey/consumerSecret)
 */
const providerRevocationConfig = {
  google: {
    revokeURL: 'https://oauth2.googleapis.com/revoke',
    authMethod: 'token_only',
  },
  facebook: {
    revokeURL: 'https://graph.facebook.com/me/permissions',
    authMethod: 'facebook',
  },
  github: {
    revokeURL: `https://api.github.com/applications/${process.env.GITHUB_ID}/token`,
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    authMethod: 'github',
  },
  x: {
    revokeURL: 'https://api.x.com/1.1/oauth/invalidate_token',
    consumerKey: process.env.X_KEY,
    consumerSecret: process.env.X_SECRET,
    authMethod: 'oauth1',
  },
  linkedin: {
    revokeURL: 'https://www.linkedin.com/oauth/v2/revoke',
    clientId: process.env.LINKEDIN_ID,
    clientSecret: process.env.LINKEDIN_SECRET,
    authMethod: 'body',
  },
  discord: {
    revokeURL: 'https://discord.com/api/oauth2/token/revoke',
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authMethod: 'body',
  },
  twitch: {
    revokeURL: 'https://id.twitch.tv/oauth2/revoke',
    clientId: process.env.TWITCH_CLIENT_ID,
    authMethod: 'client_id_only',
  },
  trakt: {
    revokeURL: 'https://api.trakt.tv/oauth/revoke',
    clientId: process.env.TRAKT_ID,
    clientSecret: process.env.TRAKT_SECRET,
    authMethod: 'trakt',
  },
  quickbooks: {
    revokeURL: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    authMethod: 'basic',
  },
};

exports.providerRevocationConfig = providerRevocationConfig;

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('errors', { msg: 'You need to be logged in to access that page.' });
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = async (req, res, next) => {
  const provider = req.path.split('/')[2];
  const token = req.user.tokens.find((token) => token.kind === provider);
  if (token) {
    if (token.accessTokenExpires && new Date(token.accessTokenExpires).getTime() < Date.now() - 1 * 60 * 1000) {
      if (token.refreshToken) {
        if (token.refreshTokenExpires && new Date(token.refreshTokenExpires).getTime() < Date.now() - 1 * 60 * 1000) {
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
              if (newTokens.params.expires_in) tokenObject.accessTokenExpires = new Date(Date.now() + newTokens.params.expires_in * 1000).toISOString();
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

// Add export for testing the internal functions
exports._saveOAuth2UserTokens = saveOAuth2UserTokens;
exports._handleAuthLogin = handleAuthLogin;
