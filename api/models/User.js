const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');



 const setSchema = new mongoose.Schema({
   setnumber: {type: Number, require: true},
   reps: {type: String, require: true},//string to account for reps/each and running "reps"
   percent: Number,
   calcweight: Number,
   actweight: Number
 })

 const exerciseSchema = new mongoose.Schema({
  name: {type: String, require: true},
  sets: [setSchema],
  tutorial: String,
  trainingnotes: String,
  max: {} //this will hold and exercise object that the set percentages will be calculated off of
 });

 const blockSchema = new mongoose.Schema({
  name: {type: String, require: true},
  exercises: [exerciseSchema]
 });

 const workoutSchema = new mongoose.Schema({
  name: {type: String, require: true},
  blocks: [blockSchema],
  time: {type: Date, require: true},
  trainingnotes: String,
  athletenotes: String
 });

 const phaseSchema = new mongoose.Schema({
  name: {type: String, require: true},
  start: {type: Date, require: true},
  end: {type: Date, require: true},
  workouts: [workoutSchema],
  notes: String
 });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, require: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  facebook: String,
  twitter: String,
  google: String,
  github: String,
  instagram: String,
  linkedin: String,
  steam: String,
  tokens: Array,

  profile: {
    firstName: String,
    lastName: String,
    phoneNumber: {type: String, require: true},
    gender: String,
    location: String,
    website: String,
    picture: String
  },

  coach: {
    isCoach: {type: Boolean, default: false},
    coachTeam: {} // will hold an object of the team
  },

  admin: {
    isAdmin: {type: Boolean, default: false},
    adminSports: [] // Array of all teams 
  },

  athlete: {
    isAthlete: {type: Boolean, default: false},
    sport: String,
    maxBench: Number,
    maxClean: Number,
    maxSquat: Number,
    maxDeadlift: Number,
    groups: [], // Array[groupSchema], array of groups the athlete is apart of 
    phases: [phaseSchema] // Array[workoutSchema]
  }
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
  name: {type: String, unique: true, require: true},
  athletes: [userSchema]
})

const teamSchema = new mongoose.Schema({
  name: {type: String, unique: true, require: true},
  athletes: [userSchema],
  groups: [groupSchema]
});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);
const Group = mongoose.model('Group', groupSchema);

module.exports = User;
module.exports = Team;
module.exports = Group;