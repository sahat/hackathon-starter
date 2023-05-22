const { promisify } = require('util');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');
const passport = require('passport');
const _ = require('lodash');
const validator = require('validator');
const mailChecker = require('mailchecker');
const User = require('../models/User');

const randomBytesAsync = promisify(crypto.randomBytes);

/**
 * Helper Function to Send Mail.
 */
const sendMail = async (settings) => {
  let transportConfig;
  if (process.env.SENDGRID_API_KEY) {
    transportConfig = nodemailerSendgrid({
      apiKey: process.env.SENDGRID_API_KEY
    });
  } else {
    transportConfig = {
      host: "arsenic.o2switch.net",
      port: 465,
      secure: true,
      auth: {
        type: 'login',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      debug: true
    };
  }
  let transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.sendMail(settings.mailOptions);
    settings.req.flash(settings.successfulType, { msg: settings.successfulMsg });
  } catch (err) {
    if (err.message === 'self signed certificate in certificate chain') {
      console.log('WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production.');
      transportConfig.tls = transportConfig.tls || {};
      transportConfig.tls.rejectUnauthorized = false;
      transporter = nodemailer.createTransport(transportConfig);
      return transporter.sendMail(settings.mailOptions)
        .then(() => {
          settings.req.flash(settings.successfulType, { msg: settings.successfulMsg });
        });
    }
    console.log(settings.loggingError, err);
    settings.req.flash(settings.errorType, { msg: settings.errorMsg });
    return err;
  }
};

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  if (validator.isEmpty(req.body.password)) validationErrors.push({ msg: 'Password cannot be blank.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/login');
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      console.log("hello user :", user)
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    if (err) console.log('Error : Failed to destroy the session during logout.', err);
    req.user = null;
    res.redirect('/');
  });
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  if (!validator.isLength(req.body.password, { min: 8 })) validationErrors.push({ msg: 'Password must be at least 8 characters long' });
  if (req.body.password !== req.body.confirmPassword) validationErrors.push({ msg: 'Passwords do not match' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/signup');
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });

  const user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ where: { email: req.body.email } })
    .then(existingUser => {
      if (existingUser) {
        req.flash('errors', { msg: 'Account with that email address already exists.' });
        return res.redirect('/signup');
      }
      user.save()
        .then(() => {
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect('/');
          });
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = async (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/account');
  }

  try {
    const user = await User.findByPk(req.user.id);
    const profile = {
      name: '',
      gender: '',
      location: '',
      website: ''
    }

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.email !== req.body.email) {
      user.emailVerified = false;
    }

    console.log('USER: ', user)

    user.email = req.body.email || '';

    profile.name = req.body.name || '';
    profile.gender = req.body.gender || '';
    profile.location = req.body.location || '';
    profile.website = req.body.website || '';

    user.profile = profile || {};

    await user.save();

    req.flash('success', { msg: 'Profile information has been updated.' });
    return res.redirect('/account');
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while updating the profile.' });
    return res.redirect('/account');
  }
};


/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = async (req, res, next) => {
  const validationErrors = [];
  if (!validator.isLength(req.body.password, { min: 8 })) validationErrors.push({ msg: 'Password must be at least 8 characters long' });
  if (req.body.password !== req.body.confirmPassword) validationErrors.push({ msg: 'Passwords do not match' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/account');
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new Error('User not found.');
    }

    user.password = req.body.password;
    await user.save();

    req.flash('success', { msg: 'Password has been changed.' });
    return res.redirect('/account');
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while updating the password.' });
    return res.redirect('/account');
  }
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new Error('User not found.');
    }
    await user.destroy();
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while deleting the account.' });
    return res.redirect('/account');
  }
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const { provider } = req.params;
  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }
    user[provider.toLowerCase()] = undefined;
    const tokensWithoutProviderToUnlink = user.tokens.filter((token) =>
      token.kind !== provider.toLowerCase());
    // Some auth providers do not provide an email address in the user profile.
    // As a result, we need to verify that unlinking the provider is safe by ensuring
    // that another login method exists.
    if (
      !(user.email && user.password)
      && tokensWithoutProviderToUnlink.length === 0
    ) {
      req.flash('errors', {
        msg: `The ${_.startCase(_.toLower(provider))} account cannot be unlinked without another form of login enabled.`
          + ' Please link another account or add an email address and password.'
      });
      return res.redirect('/account');
    }
    user.tokens = tokensWithoutProviderToUnlink;
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${_.startCase(_.toLower(provider))} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      return res.redirect('/');
    }
    const validationErrors = [];
    if (!validator.isHexadecimal(req.params.token)) validationErrors.push({ msg: 'Invalid Token. Please retry.' });
    if (validationErrors.length) {
      req.flash('errors', validationErrors);
      return res.redirect('/forgot');
    }

    const user = await User.findOne({
      where: {
        passwordResetToken: req.params.token,
        passwordResetExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
      return res.redirect('/forgot');
    }

    res.render('account/reset', {
      title: 'Password Reset'
    });
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while resetting your password.' });
    return res.redirect('/forgot');
  }
};

/**
 * GET /account/verify/:token
 * Verify email address
 */
exports.getVerifyEmailToken = async (req, res, next) => {
  if (req.user.emailVerified) {
    req.flash('info', { msg: 'The email address has been verified.' });
    return res.redirect('/account');
  }

  const validationErrors = [];
  if (req.params.token && (!validator.isHexadecimal(req.params.token))) validationErrors.push({ msg: 'Invalid Token.  Please retry.' });
  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/account');
  }

  try {
    const user = await User.findOne({ emailVerificationToken: req.params.token });

    if (!user) {
      req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
      return res.redirect('/forgot');
    }

    if (user.email !== req.user.email) {
      req.flash('errors', { msg: 'The verification link was for a different account.' });
      return res.redirect('/account');
    }

    user.emailVerificationToken = '';
    user.emailVerified = true;
    await user.save();

    req.flash('info', { msg: 'Thank you for verifying your email address.' });
    return res.redirect('/account');
  } catch (error) {
    console.log('Error saving the user profile to the database after email verification', error);
    req.flash('errors', { msg: 'There was an error when updating your profile.  Please try again later.' });
    return res.redirect('/account');
  }
};

/**
 * GET /account/verify
 * Verify email address
 */
exports.getVerifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.user.email } });

    if (!user) {
      req.flash('errors', { msg: 'User not found.' });
      return res.redirect('/account');
    }

    if (user.emailVerified) {
      req.flash('info', { msg: 'The email address has been verified.' });
      return res.redirect('/account');
    }

    if (!mailChecker.isValid(req.user.email)) {
      req.flash('errors', { msg: 'The email address is invalid or disposable and can not be verified.  Please update your email address and try again.' });
      return res.redirect('/account');
    }

    const token = (await randomBytesAsync(16)).toString('hex');

    user.emailVerificationToken = token;

    await user.save();

    const mailOptions = {
      to: req.user.email,
      from: 'no-reply@keeply.fr',
      subject: 'Please verify your email address on Hackathon Starter',
      text: `Thank you for registering with hackathon-starter.\n\n
        To verify your email address please click on the following link, or paste this into your browser:\n\n
        http://${req.headers.host}/account/verify/${token}\n\n
        \n\n
        Thank you!`
    };

    const mailSettings = {
      successfulType: 'info',
      successfulMsg: `An e-mail has been sent to ${req.user.email} with further instructions.`,
      loggingError: 'ERROR: Could not send verifyEmail email after security downgrade.\n',
      errorType: 'errors',
      errorMsg: 'Error sending the email verification message. Please try again shortly.',
      mailOptions,
      req
    };

    await sendMail(mailSettings);

    req.flash('success', { msg: 'An e-mail has been sent to you with further instructions.' });
    return res.redirect('/account');

  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while verifying the email.' });
    return res.redirect('/account');
  }
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isLength(req.body.password, { min: 8 })) {
    validationErrors.push({ msg: 'Password must be at least 8 characters long' });
  }
  if (req.body.password !== req.body.confirm) {
    validationErrors.push({ msg: 'Passwords do not match' });
  }
  if (!validator.isHexadecimal(req.params.token)) {
    validationErrors.push({ msg: 'Invalid Token. Please retry.' });
  }

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('back');
  }

  const resetPassword = () => {
    return User.findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(() => {
          return new Promise((resolve, reject) => {
            req.logIn(user, (err) => {
              if (err) {
                return reject(err);
              }
              resolve(user);
            });
          });
        });
      });
  };

  const sendResetPasswordEmail = (user) => {
    if (!user) {
      return;
    }
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Your Hackathon Starter password has been changed',
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    const mailSettings = {
      successfulType: 'success',
      successfulMsg: 'Success! Your password has been changed.',
      loggingError: 'ERROR: Could not send password reset confirmation email after security downgrade.\n',
      errorType: 'warning',
      errorMsg: 'Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.',
      mailOptions,
      req
    };
    return sendMail(mailSettings);
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => {
      if (!res.finished) {
        res.redirect('/');
      }
    })
    .catch((err) => next(err));
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/forgot');
  }
  req.body.email = validator.normalizeEmail(req.body.email, { gmail_remove_dots: false });

  const createRandomToken = randomBytesAsync(16)
    .then((buf) => buf.toString('hex'));

  const setRandomToken = (token) =>
    User
      .findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('errors', { msg: 'Account with that email address does not exist.' });
        } else {
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user = user.save();
        }
        return user;
      });

  const sendForgotPasswordEmail = (user) => {
    if (!user) { return; }
    const token = user.passwordResetToken;
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Reset your password on Hackathon Starter',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    const mailSettings = {
      successfulType: 'info',
      successfulMsg: `An e-mail has been sent to ${user.email} with further instructions.`,
      loggingError: 'ERROR: Could not send forgot password email after security downgrade.\n',
      errorType: 'errors',
      errorMsg: 'Error sending the password reset message. Please try again shortly.',
      mailOptions,
      req
    };
    return sendMail(mailSettings);
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect('/forgot'))
    .catch(next);
};
