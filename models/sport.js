// const bcrypt = require('bcrypt-nodejs');
// const crypto = require('crypto');
const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    type: String
}, { timestamps: true });

const Sport = mongoose.model('Sport', sportSchema);

module.exports = Sport;
