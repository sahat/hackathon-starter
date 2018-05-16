// file for the db schema for users
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	_id: new ObjectId(),
	firstName: {type: String, require: true},
	lastName: {type: String, require: true},
	multipass: {type: String, require: true},
	email: {type: String, require: true},
	phoneNumber: {type: String, require: true},
	coach: {
		isCoach: {type: Boolean, default: false},
		coachTeam: teamSchema
	},
	admin: {
		isAdmin: {type: Boolean, default: false},
		adminSports: Array[teamSchema]
	},
	athlete: {
		isAthlete: {type: Boolean, default: false},
		sport: String,
		maxBench: Number,
		maxClean: Number,
		maxSquat: Number,
		maxDeadlift: Number,
		groups: Array[groupSchema],
		workouts: Array[workoutSchema]
	}
});