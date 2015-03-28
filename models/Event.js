var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
	_id: Schema.Types.ObjectId,
	title: { type: String, index: true },
	description: String,
	createdBy: Schema.Types.ObjectId,
	createdDate: { type: Date, default: Date.now },
	modifiedDate: { type: Date, default: Date.now },
	eventDate: { type: Number, index: true },
	type: { type: String, index: true },
	participants: [Schema.Types.ObjectId],
	isRemind: { type: Boolean, index: true }
});

module.exports = mongoose.model('Event', eventSchema);