const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const plantSchema = new mongoose.Schema({
  scientificName: String,
  commonName: String,
  usdaName: String,
  symbol: String,
  description: String,
  notes: String,
  photos: Array,
  photoLeaf: String,
  botanicPhoto: String,
  weed: Boolean

}, { timestamps: true });


const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant;
