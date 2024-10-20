const passport = require("passport");
const refresh = require("passport-oauth2-refresh");
const axios = require("axios");
const _ = require("lodash");
const moment = require("moment");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const { Strategy: SnapchatStrategy } = require("passport-snapchat");
const { Strategy: TwitterStrategy } = require("@passport-js/passport-twitter");
const { Strategy: TwitchStrategy } = require("twitch-passport");
const { Strategy: GitHubStrategy } = require("passport-github2");
const { OAuth2Strategy: GoogleStrategy } = require("passport-google-oauth");
const { Strategy: LinkedInStrategy } = require("passport-linkedin-oauth2");
const { SteamOpenIdStrategy } = require("passport-steam-openid");
const { OAuthStrategy, OAuth2Strategy } = require("passport-oauth");

const User = require("../models/User");

// Serialize & Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Helper function to link or create user
const linkOrCreateUser = async (
  req,
  profile,
  accessToken,
  provider,
  tokenKey = "id"
) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({
        [provider]: profile[tokenKey],
      });
      if (existingUser) {
        req.flash("errors", {
          msg: `There is already a ${provider} account that belongs to you.`,
        });
        return existingUser;
      }
      const user = await User.findById(req.user.id);
      user[provider] = profile[tokenKey];
      user.tokens.push({ kind: provider, accessToken });
      user.profile.name = user.profile.name || profile.displayName;
      await user.save();
      req.flash("info", { msg: `${provider} account has been linked.` });
      return user;
    }

    const existingUser = await User.findOne({ [provider]: profile[tokenKey] });
    if (existingUser) return existingUser;

    const user = new User();
    user.email = profile.emails
      ? profile.emails[0].value
      : `${profile[tokenKey]}@${provider}.com`;
    user[provider] = profile[tokenKey];
    user.tokens.push({ kind: provider, accessToken });
    user.profile.name = profile.displayName;
    await user.save();
    return user;
  } catch (err) {
    throw err;
  }
};

// Common OAuth strategy configuration
const createOAuthStrategy = (Strategy, provider, config, tokenKey = "id") => {
  passport.use(
    new Strategy(
      config,
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const user = await linkOrCreateUser(
            req,
            profile,
            accessToken,
            provider,
            tokenKey
          );
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
};

// Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
          return done(null, false, { msg: `Email ${email} not found.` });

        user.comparePassword(password, (err, isMatch) => {
          if (err) return done(err);
          if (isMatch) return done(null, user);
          return done(null, false, { msg: "Invalid email or password." });
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

// OAuth Strategies configuration
createOAuthStrategy(FacebookStrategy, "facebook", {
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: "/auth/facebook/callback",
  profileFields: ["name", "email", "link", "locale", "timezone"],
  passReqToCallback: true,
});

createOAuthStrategy(GoogleStrategy, "google", {
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: "/auth/google/callback",
  passReqToCallback: true,
});

createOAuthStrategy(SnapchatStrategy, "snapchat", {
  clientID: process.env.SNAPCHAT_ID,
  clientSecret: process.env.SNAPCHAT_SECRET,
  callbackURL: "/auth/snapchat/callback",
  scope: ["user.display_name", "user.bitmoji.avatar"],
  passReqToCallback: true,
});

createOAuthStrategy(GitHubStrategy, "github", {
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: "/auth/github/callback",
  scope: ["user:email"],
  passReqToCallback: true,
});

createOAuthStrategy(TwitterStrategy, "twitter", {
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: "/auth/twitter/callback",
  passReqToCallback: true,
});

createOAuthStrategy(LinkedInStrategy, "linkedin", {
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: "/auth/linkedin/callback",
  scope: ["r_liteprofile", "r_emailaddress"],
  passReqToCallback: true,
});

createOAuthStrategy(TwitchStrategy, "twitch", {
  clientID: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  callbackURL: "/auth/twitch/callback",
  scope: ["user:read:email"],
  passReqToCallback: true,
});

// Refresh token for OAuth
const setupRefreshToken = (provider, strategyConfig) => {
  passport.use(provider, strategyConfig);
  refresh.use(provider, strategyConfig);
};

// Middleware to check authentication and authorization
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

exports.isAuthorized = async (req, res, next) => {
  const provider = req.path.split("/")[2];
  const token = req.user.tokens.find((token) => token.kind === provider);

  if (!token) return res.redirect(`/auth/${provider}`);

  if (
    token.accessTokenExpires &&
    moment(token.accessTokenExpires).isBefore(moment())
  ) {
    if (
      token.refreshToken &&
      moment(token.refreshTokenExpires).isAfter(moment())
    ) {
      try {
        const { accessToken, refreshToken, params } = await new Promise(
          (resolve, reject) => {
            refresh.requestNewAccessToken(
              provider,
              token.refreshToken,
              (err, newAccessToken, newRefreshToken, newParams) => {
                if (err) return reject(err);
                resolve({
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                  params: newParams,
                });
              }
            );
          }
        );

        token.accessToken = accessToken;
        if (params.expires_in)
          token.accessTokenExpires = moment()
            .add(params.expires_in, "seconds")
            .format();
        await req.user.save();
        return next();
      } catch (err) {
        console.log(err);
        return next(err);
      }
    }
    return res.redirect(`/auth/${provider}`);
  }
  next();
};
