var mongoose = require('mongoose');

var timeRangeSchema = new mongoose.Schema({
  start: Date,
  end: Date,
  day: {type: String, default: ''}
});

timeRangeSchema.methods.conflictsWith = function (other) {
	if (this.day != other.day) {
		return false;
	} else {
	  return ((this.start < other.start) && (this.end > other.start)) ||
	         ((this.start > other.start) && (this.start < other.end));
	}
};

timeRangeSchema.methods.duration = function () {
  return this.end - this.start;
};

module.exports = mongoose.model('TimeRange', timeRangeSchema);