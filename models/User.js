var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var VettRecord = require('../models/VettRecord');

var schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
};

var userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true},
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  gender: String,
  location: String,
  website: String,
  picture: String,
  facebook: String,
  twitter: String,
  google: String,
  github: String,
  vk: String,
  isOrg: Boolean
}, schemaOptions);


userSchema.pre('save', function(next) {
  var user = this;
  console.log(user);
  console.log(user.isOrg);
  if(this.isNew && !user.isOrg) {
    var vettRecord = new VettRecord({
      progress: 0,
      comments: [],
      user: user._id
    });
    vettRecord.save(function () {
      console.log("Saving new VettRecord");
      console.log(JSON.stringify(vettRecord));
    });
  }

  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    cb(err, isMatch);
  });
};

userSchema.virtual('gravatar').get(function() {
  if (!this.get('email')) {
    return 'https://gravatar.com/avatar/?s=200&d=retro';
  }
  var md5 = crypto.createHash('md5').update(this.get('email')).digest('hex');
  return 'https://gravatar.com/avatar/' + md5 + '?s=200&d=retro';
});

userSchema.virtual('details').get(function() {
 console.log("IN DETAILS");
 VettRecord.find({user: this._id}, function(err, vr) {
   console.log("Found VR: " + vr);
   return vr;
 });
});

userSchema.options.toJSON = {
  transform: function(doc, ret, options) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
  }
};

var User = mongoose.model('User', userSchema);

module.exports = User;
