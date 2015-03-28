var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
	_id: Schema.Types.ObjectId,
	title: String,
	description: String,
	createdDate: { type: Date, default: Date.now },
	createdBy: Schema.Types.ObjectId,
	eventDate: Date,
	type: String,
	participants: [Schema.Types.ObjectId],
	isActive: Boolean,
  
});

module.exports = mongoose.model('Event', eventSchema);