const axios = require('axios');
const validator = require('validator');
const nodemailerConfig = require('../config/nodemailer');

async function validateReCAPTCHA(token) {
  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    {},
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    });
  return response;
}

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  const unknownUser = !(req.user);

  res.render('contact', {
    title: 'Contact',
    sitekey: process.env.RECAPTCHA_SITE_KEY,
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

  try {
    const reCAPTCHAResponse = await validateReCAPTCHA(req.body['g-recaptcha-response']);
    if (!reCAPTCHAResponse.data.success) {
      validationErrors.push({ msg: 'reCAPTCHA validation failed.' });
    }
  } catch (error) {
    console.error('Error validating reCAPTCHA:', error);
    validationErrors.push({ msg: 'Error validating reCAPTCHA. Please try again.' });
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
      text: req.body.message
    };

    const mailSettings = {
      successfulType: 'info',
      successfulMsg: 'Email has been sent successfully!',
      loggingError: 'ERROR: Could not send contact email after security downgrade.\n',
      errorType: 'errors',
      errorMsg: 'Error sending the message. Please try again shortly.',
      mailOptions,
      req
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
