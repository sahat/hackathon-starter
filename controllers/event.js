var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var Event = require('../models/Event');
var User = require('../models/User');
var secrets = require('../config/secrets');
var bodyparser = require('body-parser');
var http = require('http');

exports.getNewEvent = function(req, res) {
	res.render('new_event', {
		title: 'New Event'
	});
};

// exports.postFreeBusy = function(req, res) {
// 	var userCalID = req.user.email
// 	var check = {
// 		items: [{id: userCalID}],
// 		timeMax: req.body.day + "T23:59:00-04:00", // hardcode range to 7am to 11:59pm
// 		timeMin: req.body.day + "T06:59:00-04:00",
// 		timeZone: "-04:00"
// 	};
// 	var response = Calendar.Freebusy.query(check);
// 	console.log(response);
// };

// remove day assertion when smart date suggestion functionality added
exports.postNewEvent = function(req, res) {
	// req.assert('title', 'Please add an event title. Thanks yo.').notEmpty();
	// req.assert('length', 'Yo, how long your pow wow gon\' be?').notEmpty();
	// req.assert('day', 'Yo, when you wanna plan dis shiz').notEmpty();
	// req.assert('users', 'Yo, why you using this app tho').notEmpty();

	// var errors = req.validationErrors();

	// if (errors) {
	// 	req.flash('errors', errors);
	// 	return res.redirect('/new_event');
	// }

	var postFreeBusy = function() {
		var userCalID = req.user.email
		var check = {
			items: [{id: userCalID}],
			timeMax: req.body.day + "T23:59:00-04:00", // hardcode range to 7am to 11:59pm
			timeMin: req.body.day + "T06:59:00-04:00",
			timeZone: "-04:00"
		};
		var apicall = Calendar.Freebusy.query(check, function(response) {
			console.log(response);
		});
	};

	postFreeBusy(); 

	var parseUsers = function(req, res) {
		var user_emails = req.body.users;
		user_emails = user_emails.replace(" ", ''); // remove whitespace
		var user_array = user_emails.split(',');
		return user_array
	};

	var newEvent = new Event({
		title: req.body.title,
		description: req.body.description,
		location: req.body.location,
		day: req.body.day,
		length: req.body.length,
		users: parseUsers(req, res),
		organizer: req.user.email
	});

	newEvent.save(function(err) {
		if (err) return next(err);
		res.redirect('/');
	});

};

exports.postDeleteEvent = function(req, res, next) {
	Event.remove({ _id: req.event.id }, function(err) {
		if (err) return next(err);
		req.flash('info', { msg: 'Your event has been deleted.' });
		res.redirect('/');
	});
};