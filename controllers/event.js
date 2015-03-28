var Event = require('../models/Event');
var mongoose = require('mongoose');
var eventService = require('../services/eventService');
var emailer = require('../services/emailer');

/**
 * POST /event
 * Create new event.
 */
exports.createEvent = function(req, res, next) {
	var event = new Event({
    	_id: new mongoose.Types.ObjectId,
		title: req.body.title || '',
		description: req.body.description || '',
		createdBy: req.user.id,
		eventDate: req.body.eventDate,
		type: req.body.type,
		participants: req.user.id,
		isRemind: false
  	});

    eventService.saveEvent(event, function(err, event) {
    	if (err) return next(err);

        emailer.notifyNewEvent(event);
        res.json(event);
    });	

};

exports.getEvents = function(req, res, next) {
	var from = new Date().getTime();
	eventService.getEventsByCriteria(null, from, null, null, null, null, null, function (err, events) {
		if (err) return next(err);
		res.json(events); 
	});
};

exports.getEvent = function(req, res, next) {
	eventService.findById(req.params.id, function(err, event) {
		if (err) return next(err);
		res.json(event);
	});
};

exports.updateEvent = function(req, res, next) {
	eventService.findById(req.params.id, function(err, event) {
		if (err) return next(err);
		event.title = req.body.title || '';
		event.description = req.body.description || '';
		event.modifiedDate = Date.now;
		event.eventDate = req.body.eventDate;
		event.type = req.body.type;

		eventService.saveEvent(event, function(err, event) {
			if (err) return next(err);

			emailer.notifyUpdateEvent(event);
			res.json(event);
		});
	});
};

exports.deleteEvent = function(req, res, next) {
	eventService.removeById(req.params.id, function(err) {
		if (err) return next(err);
		res.json({ message: 'Successfully deleted' });
	});
};

