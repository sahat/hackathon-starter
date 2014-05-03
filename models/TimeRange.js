var mongoose = require('mongoose');

var timeRangeSchema = new mongoose.Schema({
  start: Date,
  end: Date,
});

timeRangeSchema.methods.conflictsWith = function (other) {
  return ((this.start < other.start) && (this.end > other.start)) ||
         ((this.start > other.start) && (this.start < other.end));
};

timeRangeSchema.methods.duration = function () {
  return this.end - this.start;
};

module.exports = mongoose.model('TimeRange', timeRangeSchema);