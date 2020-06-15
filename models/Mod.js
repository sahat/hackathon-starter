const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ModSchema = new mongoose.Schema({
  name: String,
  dateInstalled: Date,
  installed: Boolean,
  x: Number,
  y: Number,
  locationCode:String,
  location: {type: "String", coordinates: []},
  section: String,
  installGroup: Number,
  model: String,
  orientation: String,
  shape: String,
  notes: String,
  flag: Boolean,
  decommisioned: Boolean,
  sponsor: { type: Schema.Types.ObjectId, ref: 'User' }

});

const Mod = mongoose.model('Mod', ModSchema);
module.exports = Mod;
