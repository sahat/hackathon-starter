var Event = require('../models/Event');

exports.saveEvent = function(event, callback) {
	event.save(callback);	
};

exports.getEventsByCriteria = function(keyword, from, to, types, isRemind, limit, skip, callback) {
	var query;
	if (keyword) {
		query = Event.find({ "title": { "$regex": keyword, "$options": "i" } });
	} else {
		query = Event.find();
	}
	if (from) query.where('eventDate').gt(from);
	if (to) query.where('eventDate').lt(to);
	if (types) query.where('type').in(types);
	if (isRemind != undefined) query.where('isRemind').equals(isRemind);
	if (limit) query.limit(limit);
	if (skip) query.skip(skip);
	query.exec(callback);
};

exports.findById = function(id, callback) {
	Event.findById(id, callback);	
};

exports.removeById = function(id, callback) {
	Event.remove({_id : id}, callback);
};