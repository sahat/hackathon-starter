var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var Event = require('../models/Event');
var User = require('../models/Users');
var secrets = require('../config/secrets');

exports.getNewEvent = function(req, res) {
    if (req.user) return res.redirect('/');
    res.render('new_event', {
        title: 'New Event'
    });
};

// remove day assertion when smart date suggestion functionality added
exports.postNewEvent = function(req, res) {
    req.assert('title', 'Please add an event title. Thanks yo.').notEmpty();
    req.assert('length', 'Yo, how long your pow wow gon\' be?').notEmpty();
    req.assert('day', 'Yo, when you wanna plan dis shiz').notEmpty();
    req.assert('users', 'Yo, why you using this app tho').notEmpty();

    var errors = req.validationErrors();

 	 if (errors) {
    	req.flash('errors', errors);
    	return res.redirect('/new_event');
  	}

  	function parseUsers(req, res) {
  		var user_emails = req.body.users
  		user_emails = user_emails.replace(/\s/g, '');
  		var user_array = user_emails.split(',');
  		var user_objects = [];
  		for each(int x = 0; x < user_array.length; x++) {
  			user_array[x] = user_array[x].toLowerCase();
  			user_objects[x] = _.find(User, { 'email' : user_array[x]});;
  		}
  		return user_objects;
  	}

  	var event = new Event({
   		 title: req.body.title,
   	 	 description: req.body.description,
   	 	 location: req.body.location,
   	 	 day: req.body.day,
   	 	 length: req.body.length,
   	 	 users: parseUsers(req, res),
   	 	 organizer: req.user
<<<<<<< HEAD
   	 	});



   	 for each (var user in users) {
   	 	user.events[user.events.length] = event;
   	 }

   	 event.save(function(err) {
      if (err) return next(err);
      res.redirect('/');
      });
   	 
}
=======
      });
};
>>>>>>> 5a5615816ff9b058fcbd464b322070994a71d491

exports.postDeleteEvent = function(req, res, next) {
  Event.remove({ _id: req.event.id }, function(err) {
    if (err) return next(err);
    req.flash('info', { msg: 'Your event has been deleted.' });
    res.redirect('/');
  });
};