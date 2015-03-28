var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');

var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');

var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');

var path = require('path');
var templatesDir = path.resolve(__dirname, '..', 'templates');
var emailTemplates = require('email-templates');

/**
 * Notify users of new event created based on user's preferences
 */
exports.notifyNewEvent = function(event) {
	Users.find({prefs: [event.type]}, function(err, users) {
		sendEmailNotification(event, users);
	});
}

generateJoinLink = function(user) {
	return 'http://join';
}

exports.sendEmailNotification = function(event, recipients) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(16, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			// 3. if yes, merge email template with user's name
			// 4. generate the final message

			emailTemplates(templatesDir, function(err, template) {
				 
				if (err) {
					console.log(err);
					return;
				}

				var transportBatch = nodemailer.createTransport(smtpPool({
					service: "Mandrill",
					auth: {
						user: secrets.mandrill.user,
						pass: secrets.mandrill.password
					}
				}));

				var Render = function(locals) {
    				this.locals = locals;
    				this.send = function(err, html, text) {
        				if (err) {
          					console.log(err);
        				} else {
          					transportBatch.sendMail({
								from: 'VoLAHnteer <volahnteer@gmail.com>',
								subject: locals.event.title,
								to: locals.user.email,
								html: html,
								text: text
							}, function(err, responseStatus) {
								if (err) {
									console.log(err);
								} else {
									console.log(responseStatus.message);
								}
							});
						}
					};
					this.batch = function(batch) {
    					batch(this.locals, templatesDir, this.send);
					};
				};

				template('notify-new-event', true, function(err, batch) {
    				for(var user in recipients) {
        				var render = new Render({event: event, user: recipients[user], join: generateJoinLink(user)});
        				render.batch(batch);
    				}
				});
			});
		}
	], function(err) {
	});
};

