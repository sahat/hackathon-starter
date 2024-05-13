const passport = require('passport');
const refresh = require('passport-oauth2-refresh');
const axios = require('axios');
const dotenv = require('dotenv');
// include Airtable config file
const airtable = require('../config/airtable');

const crypto = require('crypto');
const {URL} = require('url');
const qs = require('qs');
const bodyParser = require('body-parser');

const { Strategy: InstagramStrategy } = require('passport-instagram');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: SnapchatStrategy } = require('passport-snapchat');
const { Strategy: TwitterStrategy } = require('passport-twitter');
const { Strategy: TwitchStrategy } = require('passport-twitch-new');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { OAuth2Strategy: GoogleStrategy } = require('passport-google-oauth');
const { Strategy: LinkedInStrategy } = require('passport-linkedin-oauth2');
const { Strategy: OpenIDStrategy } = require('passport-openid');
const { Strategy: OAuth2Strategy } = require('passport-oauth2');
const _ = require('lodash');
const moment = require('moment');

const User = require('../models/User');
const { ref } = require('firebase/database');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return done(null, false, { msg: `Email ${email} not found.` });
    }
    if (!user.password) {
      return done(null, false, { msg: 'Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.' });
    }
    const isMatch = await user.comparePassword(password);
    if (isMatch) {
      return done(null, user);
    }
    return done(null, false, { msg: 'Invalid email or password.' });
  } catch (err) {
    return done(err);
  }
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
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ snapchat: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Snapchat account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.snapchat = profile.id;
          user.tokens.push({ kind: 'snapchat', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile.bitmoji.avatarUrl;
          user.save((err) => {
            req.flash('info', { msg: 'Snapchat account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ snapchat: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = new User();
      // Similar to Twitter & Instagram APIs, assign a temporary e-mail address
      // to get on with the registration process. It can be changed later
      // to a valid e-mail address in Profile Management.
      user.email = `${profile.id}@snapchat.com`;
      user.snapchat = profile.id;
      user.tokens.push({ kind: 'snapchat', accessToken });
      user.profile.name = profile.displayName;
      user.profile.picture = profile.bitmoji.avatarUrl;
      user.save((err) => {
        done(err, user);
      });
    });
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
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });
          user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.save((err) => {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
          done(err);
        } else {
          const user = new User();
          user.email = profile._json.email;
          user.facebook = profile.id;
          user.tokens.push({ kind: 'facebook', accessToken });
          user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = profile._json.gender;
          user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.profile.location = (profile._json.location) ? profile._json.location.name : '';
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
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
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ github: profile.id }, (err, existingUser) => {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.github = profile.id;
          user.tokens.push({ kind: 'github', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.avatar_url;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.website = user.profile.website || profile._json.blog;
          user.save((err) => {
            req.flash('info', { msg: 'GitHub account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ github: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      if (profile._json.email === null) {
        User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
          if (err) { return done(err); }
          if (existingEmailUser) {
            req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
            done(err);
          } else {
            const user = new User();
            user.email = _.get(_.orderBy(profile.emails, ['primary', 'verified'], ['desc', 'desc']), [0, 'value'], null);
            user.github = profile.id;
            user.tokens.push({ kind: 'github', accessToken });
            user.profile.name = profile.displayName;
            user.profile.picture = profile._json.avatar_url;
            user.profile.location = profile._json.location;
            user.profile.website = profile._json.blog;
            user.save((err) => {
              done(err, user);
            });
          }
        });
      }
      else {
        User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
          if (err) { return done(err); }
          if (existingEmailUser) {
            req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
            done(err);
          } else {
            const user = new User();
            user.email = _.get(_.orderBy(profile.emails, ['primary', 'verified'], ['desc', 'desc']), [0, 'value'], null);
            user.github = profile.id;
            user.tokens.push({ kind: 'github', accessToken });
            user.profile.name = profile.displayName;
            user.profile.picture = profile._json.avatar_url;
            user.profile.location = profile._json.location;
            user.profile.website = profile._json.blog;
            user.save((err) => {
              done(err, user);
            });
          }
        });
      }
    });
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
}, (req, accessToken, tokenSecret, profile, done) => {
  if (req.user) {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.twitter = profile.id;
          user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
          user.save((err) => {
            if (err) { return done(err); }
            req.flash('info', { msg: 'Twitter account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
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
      user.save((err) => {
        done(err, user);
      });
    });
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
}, (req, accessToken, refreshToken, params, profile, done) => {
  if (req.user) {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser && (existingUser.id !== req.user.id)) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
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
          user.save((err) => {
            req.flash('info', { msg: 'Google account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
          done(err);
        } else {
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
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
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
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ linkedin: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.linkedin = profile.id;
          user.tokens.push({ kind: 'linkedin', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile.photos[3].value;
          user.save((err) => {
            if (err) { return done(err); }
            req.flash('info', { msg: 'LinkedIn account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ linkedin: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.' });
          done(err);
        } else {
          const user = new User();
          user.linkedin = profile.id;
          user.tokens.push({ kind: 'linkedin', accessToken });
          user.email = profile.emails[0].value;
          user.profile.name = profile.displayName;
          user.profile.picture = user.profile.picture || profile.photos[3].value;
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with Instagram.
 */
passport.use(new InstagramStrategy({
  clientID: process.env.INSTAGRAM_ID,
  clientSecret: process.env.INSTAGRAM_SECRET,
  callbackURL: '/auth/instagram/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ instagram: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.instagram = profile.id;
          user.tokens.push({ kind: 'instagram', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.picture = user.profile.picture || profile._json.data.profile_picture;
          user.profile.website = user.profile.website || profile._json.data.website;
          user.save((err) => {
            req.flash('info', { msg: 'Instagram account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ instagram: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      const user = new User();
      user.instagram = profile.id;
      user.tokens.push({ kind: 'instagram', accessToken });
      user.profile.name = profile.displayName;
      // Similar to Twitter API, assigns a temporary e-mail address
      // to get on with the registration process. It can be changed later
      // to a valid e-mail address in Profile Management.
      user.email = `${profile.username}@instagram.com`;
      user.profile.website = profile._json.data.website;
      user.profile.picture = profile._json.data.profile_picture;
      user.save((err) => {
        done(err, user);
      });
    });
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
}, (req, accessToken, refreshToken, params, profile, done) => {
  if (req.user) {
    User.findOne({ twitch: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser && (existingUser.id !== req.user.id)) {
        req.flash('errors', { msg: 'There is already a Twitch account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
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
          user.save((err) => {
            req.flash('info', { msg: 'Twitch account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitch: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.email }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Twtich manually from Account Settings.' });
          done(err);
        } else {
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
          user.save((err) => {
            done(err, user);
          });
        }
      });
    });
  }
});
passport.use('twitch', twitchStrategyConfig);
refresh.use('twitch', twitchStrategyConfig);


/**
 * Pinterest API OAuth.
 */
passport.use('pinterest', new OAuth2Strategy({
  authorizationURL: 'https://api.pinterest.com/oauth/',
  tokenURL: 'https://api.pinterest.com/v1/oauth/token',
  clientID: process.env.PINTEREST_ID,
  clientSecret: process.env.PINTEREST_SECRET,
  callbackURL: process.env.PINTEREST_REDIRECT_URL,
  passReqToCallback: true
},
(req, accessToken, refreshToken, profile, done) => {
  User.findById(req.user._id, (err, user) => {
    if (err) { return done(err); }
    user.tokens.push({ kind: 'pinterest', accessToken });
    user.save((err) => {
      done(err, user);
    });
  });
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
  passReqToCallback: true
},
(res, accessToken, refreshToken, params, profile, done) => {
  User.findById(res.user._id, (err, user) => {
    if (err) { return done(err); }
    user.quickbooks = res.query.realmId;
    if (user.tokens.filter((vendor) => (vendor.kind === 'quickbooks'))[0]) {
      user.tokens.some((tokenObject) => {
        if (tokenObject.kind === 'quickbooks') {
          tokenObject.accessToken = accessToken;
          tokenObject.accessTokenExpires = moment().add(params.expires_in, 'seconds').format();
          tokenObject.refreshToken = refreshToken;
          tokenObject.refreshTokenExpires = moment().add(params.x_refresh_token_expires_in, 'seconds').format();
          if (params.expires_in) tokenObject.accessTokenExpires = moment().add(params.expires_in, 'seconds').format();
          return true;
        }
        return false;
      });
      user.markModified('tokens');
      user.save((err) => { done(err, user); });
    } else {
      user.tokens.push({
        kind: 'quickbooks',
        accessToken,
        accessTokenExpires: moment().add(params.expires_in, 'seconds').format(),
        refreshToken,
        refreshTokenExpires: moment().add(params.x_refresh_token_expires_in, 'seconds').format()
      });
      user.save((err) => { done(err, user); });
    }
  });
});
passport.use('quickbooks', quickbooksStrategyConfig);
refresh.use('quickbooks', quickbooksStrategyConfig);

/**
 * Airtable API Oauth2
 */

const airtableStrategyConfig = new OAuth2Strategy({
    authorizationURL: 'https://airtable.com/oauth2/v1/authorize', // Ajustez selon la doc d'Airtable
    tokenURL: 'https://airtable.com/oauth2/v1/token', // Ajustez selon la doc d'Airtable
    clientID: process.env.AIRTABLE_CLIENT_ID,
    clientSecret: process.env.AIRTABLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/airtable/callback`,
    scope: process.env.AIRTABLE_SCOPE, // Ajustez selon la doc d'Airtable
    passReqToCallback: true, // Pour passer la requête au callback
    state: true,
    pkce: true
  }, (req, accessToken, refreshToken, params, profile, done) => {
    
    console.log('req query: ', req.query);
    console.log('accessToken: ', accessToken)
    console.log('refreshToken: ', refreshToken)
    console.log('params: ', params)
    
    // Si params n'est pas vide, on a reçu un code d'autorisation
    if (params) {
      // On fait un appel à l'API d'Airtable pour récupérer les informations de l'utilisateur
      axios.get('https://api.airtable.com/v0/meta/whoami', {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
      })
      .then((response) => {
        // Retreive the user infos from the response
        let airtableUser = response.data;
        console.log('airtableUser: ', airtableUser);

        const user = new User({
          email: airtableUser.email,
          password: null // Because we are using OAuth, we don't need a password
        });
        // On vérifie si l'utilisateur est déjà enregistré dans la base de données en le cherchant par son email avec 'where'
        User.findOne({ where: { email: user.email } })
          .then(existingUser => {
            if (existingUser) {
              // Si l'utilisateur existe déjà, on le connecte
              console.log('User already exists');
              done(null, existingUser);
            }
            user.save()
              .then(() => {
                req.logIn(user, (err) => {
                  if (err) {
                    return done(err);
                  }
                  console.log('User saved successfully');
                  done(null, user);
                });
              })
              .catch(err => done(err));
          })
          .catch(err => done(err));
      })
      .catch((error) => {
        console.error('Error while fetching user infos from Airtable API: ', error);
        done(error);
      });
    }
  });
  
    // User.findById(req.user._id, (err, user) => {
    //   if (err) { return done(err); }

    //   // Logique pour mettre à jour ou ajouter le token d'Airtable à l'utilisateur
    //   const existingToken = user.tokens.find(token => token.kind === 'airtable');
      
    //   if (existingToken) {
    //     existingToken.accessToken = accessToken;
    //     existingToken.accessTokenExpires = moment().add(params.expires_in, 'seconds').toDate();
    //     existingToken.refreshToken = refreshToken;
    //     existingToken.refreshTokenExpires = moment().add(params.x_refresh_token_expires_in, 'seconds').toDate();
    //   } else {
    //     user.tokens.push({
    //       kind: 'airtable',
    //       accessToken,
    //       accessTokenExpires: moment().add(params.expires_in, 'seconds').toDate(),
    //       refreshToken,
    //       refreshTokenExpires: moment().add(params.x_refresh_token_expires_in, 'seconds').toDate()
    //     });
    //   }

    //   user.save((err) => {
    //     if (err) { return done(err); }
    //     return done(null, user);
    //   });
    // });
//   }
// );

passport.use('airtable', airtableStrategyConfig);
refresh.use('airtable', airtableStrategyConfig);


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
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/')[2];
  const token = req.user.tokens.find((token) => token.kind === provider);
  if (token) {
    // Is there an access token expiration and access token expired?
    // Yes: Is there a refresh token?
    //     Yes: Does it have expiration and if so is it expired?
    //       Yes, Quickbooks - We got nothing, redirect to res.redirect(`/auth/${provider}`);
    //       No, Quickbooks and Google- refresh token and save, and then go to next();
    //    No:  Treat it like we got nothing, redirect to res.redirect(`/auth/${provider}`);
    // No: we are good, go to next():
    if (token.accessTokenExpires && moment(token.accessTokenExpires).isBefore(moment().subtract(1, 'minutes'))) {
      if (token.refreshToken) {
        if (token.refreshTokenExpires && moment(token.refreshTokenExpires).isBefore(moment().subtract(1, 'minutes'))) {
          res.redirect(`/auth/${provider}`);
        } else {
          refresh.requestNewAccessToken(`${provider}`, token.refreshToken, (err, accessToken, refreshToken, params) => {
            User.findById(req.user.id, (err, user) => {
              user.tokens.some((tokenObject) => {
                if (tokenObject.kind === provider) {
                  tokenObject.accessToken = accessToken;
                  if (params.expires_in) tokenObject.accessTokenExpires = moment().add(params.expires_in, 'seconds').format();
                  return true;
                }
                return false;
              });
              req.user = user;
              user.markModified('tokens');
              user.save((err) => {
                if (err) console.log(err);
                next();
              });
            });
          });
        }
      } else {
        res.redirect(`/auth/${provider}`);
      }
    } else {
      next();
    }
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
