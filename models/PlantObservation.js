const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const plantObservationSchema = Schema({
  individualPlant: { type: Schema.Types.ObjectId, ref: 'individualPlant' },
  module: { type: Schema.Types.ObjectId, ref: 'Mod' },
  observedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  blooming: Boolean,
  herbivory: Boolean,
  dead: Boolean,
  insects: Array,
  photo: Array,
  notes: String,
  height: Number,
  weeds: Boolean,
  flag: Boolean

}, { timestamps: true });
const PlantObservation = mongoose.model('plantObservation', plantObservationSchema);
module.exports = PlantObservation;
