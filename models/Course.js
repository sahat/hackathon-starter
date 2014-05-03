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

var courseSchema = new mongoose.Schema({
/*
  '$course_id': {
    'class_name': 'Animal Minds',
    'classification': 'ANST-UA',
    'college': 'College of Arts and Science',
    'component': 'Lecture',
    'course_name': 'Topics is AS',
    'description': 'This course analyzes the ways that...',
    'grading': 'CAS Graded',
    'is_open': 'Open',
    'level': 'Undergraduate',
    'loc_code': 'WS',
    'meet_data': '09/06/2011 - 12/23/2011 Mon,Wed 11.00 AM - 12.15 PM with Sebo, Jeffrey',
    'notes': 'Open only to ANST minors during the first...',
    'number': '600',
    'section': '001',
    'session': '09/06/2011 - 12/16/2011',
  }
*/
  class_name: {type: String, index: true, required: true},
  classification: {type: String, index: true, required: true},
  college: {type: String, index: true, required: true},
  component: String,
  course_name: {type: String, index: true, required: true},
  description: {type: String, default: '', index: true},
  grading: String,
  instructor: {type: String, default: '', index: true},
  is_open: {type: Boolean, required: true},
  level: String,
  loc_code: {type: String, required: true},
  meet_data: [timeRangeSchema],
  notes: String,
  number: String,
  section: String,
  session: {type: mongoose.Schema.ObjectId, ref: 'timeRangeSchema'},
  units: Number
});

courseSchema.methods.conflictsWith = function (other) {
  if (this.session.conflictsWith(other.session)) {
    for (i = 0; i < this.meet_data.length; i++) {
      for (j = 0; j < other.meet_data.length; j++) {
        if (this.meet_data[i].conflictsWith(other.meet_data[j])){
          return true;
        }
      }
    }
  } else {
    return false;
  }
};

module.exports = mongoose.model('Course', courseSchema);
