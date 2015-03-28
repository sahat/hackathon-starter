var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
	_id: Schema.Types.ObjectId,
	title: String,
	description: String,
	createdBy: Schema.Types.ObjectId,
	createdDate: { type: Date, default: Date.now },
	modifiedDate: { type: Date, default: Date.now },
	eventDate: Number,
	type: String,
	participants: [Schema.Types.ObjectId]
  
});

module.exports = mongoose.model('Event', eventSchema);