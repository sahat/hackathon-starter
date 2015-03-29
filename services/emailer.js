var _ = require('lodash');
var async = require('async');
var crypt = require('./crypt');

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
	console.log('new event notification - event type - ' + event.type);
	User.find({'preferences': {$in: [event.type]}}, function(err, users) {
		sendEmailNotification('notify-new-event', event, users);
	});
}

exports.notifyUpdateEvent = function(event) {
	User.find({'_id': {$in: event.participants}}, function(err, users) {
			sendEmailNotification('notify-update-event', event, users);
	});
}

generateJoinLink = function(eventId, userId) {
	var encEventId = crypt.encrypt(eventId.toString());
	var encUserId = crypt.encrypt(userId.toString());
	return secrets.serverUrl + '/join/' + encEventId + '/' + encUserId;
}

sendEmailNotification = function(templateName, event, recipients) {
	async.waterfall([
		function(done) {
			crypt.generateToken(function(err, token) {
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
								subject: 'VoLAHnteer for ' + locals.event.title,
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

				template(templateName, true, function(err, batch) {
    				for(var user in recipients) {
        				var render = new Render({event: event, user: recipients[user], join: generateJoinLink(event._id, recipients[user]._id)});
        				render.batch(batch);
    				}
				});
			});
		}
	], function(err) {
	});
}

exports.sendEmailNotification = sendEmailNotification;
