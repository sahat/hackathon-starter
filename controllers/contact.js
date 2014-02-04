/**
 * Module Dependencies
 */

var secrets   = require('../config/secrets');
var sendgrid  = require('sendgrid')(secrets.sendgrid.user, secrets.sendgrid.password);

module.exports.controller = function(app) {

/**
 * GET /contact route
 */
  app.get('/contact', function(req, res) {
    res.render('contact', {
      title: 'Contact'
    });
  });

/**
 * POST /contact route
 */
  app.post('/contact', function(req, res) {
    req.assert('name', 'Name cannot be blank').notEmpty();
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('message', 'Message cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/contact');
    }

    var from = req.body.email;
    var name = req.body.name;
    var body = req.body.message;
    var to = 'you@email.com';
    var subject = 'API Example | Contact Form';

    var email = new sendgrid.Email({
      to: to,
      from: from,
      subject: subject,
      text: body + '\n\n' + name
    });

    sendgrid.send(email, function(err) {
      if (err) {
        req.flash('errors', { msg: err.message });
        return res.redirect('/contact');
      }
      req.flash('success', { msg: 'Email has been sent successfully!' });
      res.redirect('/contact');
    });
  });

}
