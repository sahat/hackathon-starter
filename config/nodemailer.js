const nodemailer = require('nodemailer');

/**
 * Helper Function to Send Mail.
 * This function handles sending emails using nodemailer with automatic retry logic
 * for self-signed certificate issues commonly encountered in development environments.
 * 
 * @param {Object} settings - Configuration object containing email and response settings
 * @param {Object} settings.mailOptions - Nodemailer mail options (to, from, subject, text, html, etc.)
 * @param {Object} settings.req - Express request object for flash messages
 * @param {string} settings.successfulType - Flash message type for success (e.g., 'success')
 * @param {string} settings.successfulMsg - Flash message content for success
 * @param {string} settings.errorType - Flash message type for error (e.g., 'error')  
 * @param {string} settings.errorMsg - Flash message content for error
 * @param {string} settings.loggingError - Error message for console logging
 * @returns {Promise} Promise that resolves when email is sent or fails
 */
exports.sendMail = (settings) => {
  // Configure the email transporter with SMTP settings from environment variables
  const transportConfig = {
    host: process.env.SMTP_HOST,      // SMTP server hostname
    port: 465,                        // SSL port for secure connection
    secure: true,                     // Use SSL/TLS
    auth: {
      user: process.env.SMTP_USER,    // SMTP username from environment
      pass: process.env.SMTP_PASSWORD // SMTP password from environment
    },
  };

  // Create the email transporter instance
  let transporter = nodemailer.createTransport(transportConfig);

  // Attempt to send the email
  return transporter
    .sendMail(settings.mailOptions)
    .then(() => {
      // Email sent successfully - set flash message for user feedback
      settings.req.flash(settings.successfulType, { msg: settings.successfulMsg });
    })
    .catch((err) => {
      // Handle specific error: self-signed certificate (common in development)
      if (err.message === 'self signed certificate in certificate chain') {
        console.log('WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production.');
        
        // Modify config to accept self-signed certificates (for development only)
        transportConfig.tls = transportConfig.tls || {};
        transportConfig.tls.rejectUnauthorized = false; // Disable certificate validation
        
        // Create new transporter with updated configuration
        transporter = nodemailer.createTransport(transportConfig);
        
        // Retry sending the email with relaxed security settings
        return transporter
          .sendMail(settings.mailOptions)
          .then(() => {
            // Retry successful - set success flash message
            settings.req.flash(settings.successfulType, { msg: settings.successfulMsg });
          })
          .catch((retryErr) => {
            // Retry also failed - log error and set error flash message
            console.log(settings.loggingError, retryErr);
            settings.req.flash(settings.errorType, { msg: settings.errorMsg });
            return retryErr;
          });
      }
      
      // Handle all other errors (not self-signed certificate related)
      console.log(settings.loggingError, err);
      settings.req.flash(settings.errorType, { msg: settings.errorMsg });
      return err;
    });
};