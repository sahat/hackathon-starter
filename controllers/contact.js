const validator = require('validator');
const nodemailerConfig = require('../config/nodemailer');

async function validateReCAPTCHA(token) {
  const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
  });
  return response.json();
}

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  const unknownUser = !req.user;

  if (!process.env.RECAPTCHA_SITE_KEY) {
    console.warn('\x1b[33mWARNING: RECAPTCHA_SITE_KEY is missing. Add a key to your .env, env variable, or use a WebApp Firewall with an interactive challenge before going to production.\x1b[0m');
  }

  res.render('contact', {
    title: 'Contact',
    sitekey: process.env.RECAPTCHA_SITE_KEY || null, // Pass null if the key is missing
    unknownUser,
  });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = async (req, res, next) => {
  const validationErrors = [];
  let fromName;
  let fromEmail;
  if (!req.user) {
    if (validator.isEmpty(req.body.name)) validationErrors.push({ msg: 'Please enter your name' });
    if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  }
  if (validator.isEmpty(req.body.message)) validationErrors.push({ msg: 'Please enter your message.' });

  if (!process.env.RECAPTCHA_SITE_KEY) {
    console.warn('\x1b[33mWARNING: RECAPTCHA_SITE_KEY is missing. Add a key to your .env or use a WebApp Firewall for CAPTCHA validation before going to production.\x1b[0m');
  } else if (!validator.isEmpty(req.body['g-recaptcha-response'])) {
    try {
      const reCAPTCHAResponse = await validateReCAPTCHA(req.body['g-recaptcha-response']);
      if (!reCAPTCHAResponse.success) {
        validationErrors.push({ msg: 'reCAPTCHA validation failed.' });
      }
    } catch (error) {
      console.error('Error validating reCAPTCHA:', error);
      validationErrors.push({ msg: 'Error validating reCAPTCHA. Please try again.' });
    }
  } else {
    validationErrors.push({ msg: 'reCAPTCHA response was missing.' });
  }

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/contact');
  }

  if (!req.user) {
    fromName = req.body.name;
    fromEmail = req.body.email;
  } else {
    fromName = req.user.profile.name || '';
    fromEmail = req.user.email;
  }

  const sendContactEmail = async () => {
    const mailOptions = {
      to: process.env.SITE_CONTACT_EMAIL,
      from: `${fromName} <${fromEmail}>`,
      subject: 'Contact Form | Hackathon Starter',
      text: req.body.message,
    };

    const mailSettings = {
      successfulType: 'info',
      successfulMsg: 'Email has been sent successfully!',
      loggingError: 'ERROR: Could not send contact email after security downgrade.\n',
      errorType: 'errors',
      errorMsg: 'Error sending the message. Please try again shortly.',
      mailOptions,
      req,
    };

    return nodemailerConfig.sendMail(mailSettings);
  };

  try {
    await sendContactEmail();
    res.redirect('/contact');
  } catch (error) {
    next(error);
  }
};
