var mongoose = require('mongoose');

var timeRangeSchema = new mongoose.Schema({
  start: Date,
  end: Date,
  level: {type: String, enum: ["day", "hour"]}
});

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
  class_name: {type: String, unique: true, index: true, required: true},
  classification: {type: String, index: true, required: true},
  college: {type: String, index: true, required: true},
  component: type: String,
  course_name: {type: String, index: true, required: true},
  description: {type: String, default: '', index: true},
  grading: {type: String, default: ''},
  is_open: {type: Boolean, required: true},
  level: {type; String, default: ''},
  loc_code: {type: String, required: true},
  notes: {type: String, default: ''},
  number: Number,
  section: Number,
  session: timeRangeSchema,
  meet_data: [timeRangeSchema]

});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */

userSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(5, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

/**
 * Validate user's password.
 * Used by Passport-Local Strategy for password validation.
 */

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

/**
 * Get URL to a user's gravatar.
 * Used in Navbar and Account Management page.
 */

userSchema.methods.gravatar = function(size) {
  if (!size) size = 200;

  if (!this.email) {
    return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
  }

  var md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

module.exports = mongoose.model('User', userSchema);
