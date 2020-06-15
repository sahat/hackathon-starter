/**
 * GET /
 * Home page.
 */

 const Plant = require('../models/Plant.js');
 const IndividualPlant = require('../models/IndividualPlant.js');
 const PlantObservation = require('../models/PlantObservation.js');

 const Mod = require('../models/Mod.js');

exports.index = (req, res) => {
  Plant.find((err, plant) => {
  Mod.find((err, docs) => {
    IndividualPlant.find((err, ip) => {

  res.render('home', {
    title: 'Home',
     mods: docs ,
     plants: plant,
     individualPlant: ip

  });
});
});
});
};
