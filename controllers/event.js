var Event = require('../models/Event');
var mongoose = require('mongoose');

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
		participants: req.user.id
  	});


    event.save(function(err, event) {
    	if (err) return next(err);
    	res.json(event);
    });	

};

exports.getEvents = function(req, res, next) {
	Event
	.find()
	.where('eventDate').gt(new Date().getTime())
	.exec(function (err, events) {
		if (err) return next(err);
		res.json(events); //todo pagination
	});
};

exports.getEvent = function(req, res, next) {
	Event.findById(req.params.id, function(err, event) {
		if (err) return next(err);
		console.log(event);
		res.json(event);
	});
};

exports.updateEvent = function(req, res, next) {
	Event.findById(req.params.id, function(err, event) {
		if (err) return next(err);
		event.title = req.body.title || '';
		event.description = req.body.description || '';
		event.modifiedDate = Date.now;
		event.eventDate = req.body.eventDate;
		event.type = req.body.type;

		event.save(function(err, event) {
			if (err) return next(err);
			res.json(event);
		});
	});
};

exports.deleteEvent = function(req, res, next) {
	Event.remove({_id : req.params.id}, function(err) {
		if (err) return next(err);
		res.json({ message: 'Successfully deleted' });
	});
};