const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const individualPlantSchema = Schema({
  plant: { type: Schema.Types.ObjectId, ref: 'Plant' },
  x: Number,
  y: Number,
  module: { type: Schema.Types.ObjectId, ref: 'Mod' },
  supplier: String,
  datePlanted: Date,
  sponsor: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const IndividualPlant = mongoose.model('individualPlant', individualPlantSchema);
module.exports = IndividualPlant;
