const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
    name: String,
    places: Number,
    complet: String,
    ferme: String,
    ouvert: String,
    capacite: Number,
    id: Number,
    adresse: String,
    date_maj: Date,
    taux_occup :Number,
    taux_dispo:Number,
    lien: String,
    latitude: Number,
    longitude: Number,
}, { timestamps: true });

const Parking = mongoose.model('Parking', parkingSchema);

module.exports = Parking;