/*This file is for exercises that aren't yet assigned to a workout*/

const mongoose = require('mongoose');



 const exerciseSchema = new mongoose.Schema({
  name: {type: String, require: true},
  sets: [setSchema],
  tutorial: String,
  trainingnotes: String,
  max: {} //this will hold and exercise object that the set percentages will be calculated off of
 });

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;