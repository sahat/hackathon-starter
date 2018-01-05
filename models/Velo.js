const mongoose = require('mongoose');

const veloSchema = new mongoose.Schema({
    number: Number,
    name: String,
    adress: String,
    latitude: Number,
    longitude: Number,
    banking: Boolean,
    bonus: Boolean,
    status:String,
    contract_name: String,
    bike_stands: Number,
    available_bike_stands:Number,
    available_bikes:Number,
    last_update:Number

}, { timestamps: true });

const Velo = mongoose.model('Velo', veloSchema);

module.exports = Velo;