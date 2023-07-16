const axios = require('axios');
const validator = require('validator');
const nodemailer = require('nodemailer');

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
exports.postContact = async (req, res) => {
  const validationErrors = [];
  let fromName;
  let fromEmail;
  if (!req.user) {
    if (validator.isEmpty(req.body.name)) validationErrors.push({ msg: 'Please enter your name' });
    if (!validator.isEmail(req.body.email)) validationErrors.push({ msg: 'Please enter a valid email address.' });
  }
  if (validator.isEmpty(req.body.message)) validationErrors.push({ msg: 'Please enter your message.' });

  function getValidateReCAPTCHA(token) {
    return axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      {},
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      });
  }

  try {
    const validateReCAPTCHA = await getValidateReCAPTCHA(req.body['g-recaptcha-response']);
    if (!validateReCAPTCHA.data.success) {
      validationErrors.push({ msg: 'reCAPTCHA validation failed.' });
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

    const transportConfig = {
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };

    let transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      to: process.env.SITE_CONTACT_EMAIL,
      from: `${fromName} <${fromEmail}>`,
      subject: 'Contact Form | Hackathon Starter',
      text: req.body.message
    };

    return transporter.sendMail(mailOptions)
      .then(() => {
        req.flash('success', { msg: 'Email has been sent successfully!' });
        res.redirect('/contact');
      })
      .catch((err) => {
        if (err.message === 'self signed certificate in certificate chain') {
          console.log('WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production.');
          transportConfig.tls = transportConfig.tls || {};
          transportConfig.tls.rejectUnauthorized = false;
          transporter = nodemailer.createTransport(transportConfig);
          return transporter.sendMail(mailOptions);
        }
        console.log('ERROR: Could not send contact email after security downgrade.\n', err);
        req.flash('errors', { msg: 'Error sending the message. Please try again shortly.' });
        return false;
      })
      .then((result) => {
        if (result) {
          req.flash('success', { msg: 'Email has been sent successfully!' });
          return res.redirect('/contact');
        }
      })
      .catch((err) => {
        console.log('ERROR: Could not send contact email.\n', err);
        req.flash('errors', { msg: 'Error sending the message. Please try again shortly.' });
        return res.redirect('/contact');
      });
  } catch (err) {
    console.log(err);
  }
};
