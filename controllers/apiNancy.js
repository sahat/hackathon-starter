const Parking = require('../models/Parking.js');


exports.getParking = (req, res) => {
    Parking.find((err, docs) => {
        res.render('park', {
        allPark: docs
    });
});
};
