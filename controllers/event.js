var Event = require('../models/Event');
var mongoose = require('mongoose');
var eventService = require('../services/eventService');
var emailer = require('../services/emailer');
var qr = require('qr-image');  
var fs = require('fs');
var secrets = require('../config/secrets');
var path = require('path');
var qrDir = path.resolve(__dirname, '..', 'qrcodes');
var reserve = require('../services/reserve');

/**
 * POST /event
 * Create new event for review.
 */
exports.createEvent = function(req, res, next) {
	var event = new Event({
    	_id: new mongoose.Types.ObjectId,
		title: req.body.title || '',
		description: req.body.description || '',
		createdBy: req.user.id,
		eventDate: req.body.eventDate,
		type: req.body.type,
		//participants: req.user.id,
		isRemind: false
  	});

    eventService.saveEvent(event, function(err, event) {
    	if (err) return next(err);
        reserve.addEvent(event._id, req.user.id, function(err, result) {
        	if (err) return next(err);
        	res.json(event);
        });
		console.log('about to notify users about the new event just created!');
        emailer.notifyNewEvent(event);       
    });		

};

exports.getEvents = function(req, res, next) {
	var from = new Date().getTime();
	eventService.getEventsByCriteria(null, null, from, null, null, null, null, null, function (err, events) {
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

/*this is a commet added by chamila to test*/
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

exports.findAllEventsCreatedByUser = function(req, res, next) {
	var from = new Date().getTime();
	eventService.getEventsByCriteria(null, req.user.id, from, null, null, null, null, null, function (err, events) {
    	if (err) return next(err);
    	res.json(events); 
  	});
};

exports.generateQrCode = function(req, res, next) {
	var eventId = req.params.eventId;
	var url = secrets.serverUrl + '/event/' + eventId;
	var absoluteQrPath = qrDir + '/' + eventId + '.png';
	fs.open(absoluteQrPath, 'r', function(err, fd) {
		if (err) {
			var code = qr.image(url, { type: 'png' });  
			var output = fs.createWriteStream(qrDir + '/' + eventId + '.png');
			code.pipe(output);
		}

		res.sendFile(absoluteQrPath);
	});
}

