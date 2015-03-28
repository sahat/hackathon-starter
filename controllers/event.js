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
		isActive: true,
  	});


    event.save(function(err, event) {
    	if (err) return next(err);
    	//req.flash('success', { msg: 'Event Created' });
    	res.json(event);
    });	

};