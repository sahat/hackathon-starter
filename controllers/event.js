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

exports.postNewEvent = function(req, res) {
    req.assert('title', 'Title required').notEmpty();
}