  var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var eventSchema = new mongoose.Schema({
  title: { type: String, default: ''},
  // organizer: Schema.Types.ObjectId,
  description: { type: String, default: ''},
  location: { type: String, default: ''},
  day: { type: Date },
  length: Number, 
  // users: [Schema.Types.ObjectId]
});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */

eventSchema.pre('save', function(next) {
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



module.exports = mongoose.model('Event', eventSchema);
