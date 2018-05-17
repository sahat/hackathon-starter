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

 const exerciseWithRepsSchema = new mongoose.Schema({
  name: {type: String, require: true},
  sets: [setSchema],
  tutorial: String,
  trainingnotes: String,
  max: {} //this will hold an object that will hold the name of the exercise the set percentages will be calculated off of as well as the atheletes max for that exercise
 });

 const blockSchema = new mongoose.Schema({
  name: {type: String, require: true},
  exercises: [exerciseWithRepsSchema]
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
  notes: String,
  approved: {type: Boolean, default: false}
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
    first: {type: String, require: true},
    last: {type: String, require: true},
    phone: {type: String, require: true},
    gender: String,
    location: String,
    website: String,
    picture: String
  },
  isCoach: {type: Boolean, default: false},
  isAdmin: {type: Boolean, default: false},
  
  coach: {
    coachTeam: {} // will hold an object of the team
  },

  admin: {
    adminSports: [] // Array of all teams 
  },

  athlete: {
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
  athletes: [userSchema],
  phases: [phaseSchema]
})

const teamSchema = new mongoose.Schema({
  name: {type: String, unique: true, require: true},
  athletes: [userSchema],
  groups: [groupSchema],
  phases: [phaseSchema]
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
const Phase = mongoose.model('Phase', phaseSchema);
const SetSchema = mongoose.model('Set', setSchema);
const ExerciseWithReps = mongoose.model('ExerciseWithReps', exerciseWithRepsSchema);
const Block = mongoose.model('Block', blockSchema);
const Workout = mongoose.model('Workout', workoutSchema);

module.exports = User;
module.exports = Team;
module.exports = Group;
module.exports = Phase;
module.exports = SetSchema;
module.exports = ExerciseWithReps;
module.exports = Block;
module.exports = Workout;