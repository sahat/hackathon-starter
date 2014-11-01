var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var Event = require('../models/Event');
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
    req.assert('users', 'Yo, why the fuck you using this app').notEmpty();
}