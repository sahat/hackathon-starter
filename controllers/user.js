const { promisify } = require('util');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');

const randomBytesAsync = promisify(crypto.randomBytes);

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  return res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      return res.redirect(req.session.returnTo || '/');
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
    return res.redirect('/');
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
  return res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = async (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  const { body: { email, password } } = req;
  const user = new User({
    email,
    password
  });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    await user.save();
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => res.render('account/profile', {
  title: 'Account Management'
});

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = async (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  try {
    const { body, user: { id } } = req;
    const user = await User.findById(id);
    Object.assign(user.profile, body);
    const UserWithSameEmail = await User.count({ email: body.email });
    if (UserWithSameEmail > 0) {
      req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
      return res.redirect('/account');
    }
    await user.save();
    req.flash('success', { msg: 'Profile information has been updated.' });
    return res.redirect('/account');
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = async (req, res, next) => {
  const { body: { password }, user: { id } } = req;
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  try {
    const user = await User.findById(id);
    user.password = password;
    await user.save();
    req.flash('success', { msg: 'Password has been changed.' });
    return res.redirect('/account');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = async (req, res, next) => {
  try {
    await User.remove({ _id: req.user.id });
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id);
    // unlink this provider
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    await user.save();
    req.flash('info', { msg: `${provider} account has been unlinked.` });
    return res.redirect('/account');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  try {
    const user = await User.findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now())
      .exec();
    if (!user) {
      req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
      return res.redirect('/forgot');
    }
    return res.render('account/reset', {
      title: 'Password Reset'
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = async (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  const resetPassword = async () => {
    const user = await User.findOne({ passwordResetToken: req.params.token })
      .where('passwordResetExpires').gt(Date.now());
    if (!user) {
      req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
      return res.redirect('back');
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    req.logIn(user, (err) => {
      if (err) { throw (err); }
      return user;
    });
  };

  const sendResetPasswordEmail = async (user) => {
    if (!user) { return; }
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Your Hackathon Starter password has been changed',
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    await transporter.sendMail(mailOptions);
    req.flash('success', { msg: 'Success! Your password has been changed.' });
  };

  try {
    await resetPassword();
    await sendResetPasswordEmail();
    if (!res.finished) {
      res.redirect('/');
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  return res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = async (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  const setRandomToken = async (token) => {
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash('errors', { msg: 'Account with that email address does not exist.' });
    } else {
      user.passwordResetToken = token;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      user = await user.save();
    }
    return user;
  };

  const sendForgotPasswordEmail = async (user) => {
    if (!user) { return; }
    const token = user.passwordResetToken;
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Reset your password on Hackathon Starter',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    await transporter.sendMail(mailOptions);
    req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
  };

  try {
    const tokenBuffer = await randomBytesAsync(16);
    const user = await setRandomToken(tokenBuffer.toString('hex'));
    await sendForgotPasswordEmail(user);
    return res.redirect('/forgot');
  } catch (error) {
    console.error(error);
    return next(error);
  }
};
