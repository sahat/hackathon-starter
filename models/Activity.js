const mongoose = require('mongoose');

// User Schema
const ActivitySchema = mongoose.Schema({
  userId: {
    type: String,
    index: true
  },
  duration: {
    type: Number
  },
  date: {
    type: Date
  },
  distance: {
    type: Number
  },
  note: {
    type: String
  },
  type: {
    type: String
  }
});

const Activity = mongoose.model('Activity', ActivitySchema);
module.exports = Activity;
