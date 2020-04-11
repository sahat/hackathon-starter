/**
 * GET /module
*/
const Plant = require('../models/Plant.js');
const IndividualPlant = require('../models/IndividualPlant.js');
const PlantObservation = require('../models/PlantObservation.js');

const Mod = require('../models/Mod.js');

exports.getMod = (req, res) => {
  Mod.find((err, docs) => {
    res.render('modules', { mods: docs });
  });
};


exports.postMod = (req, res, next) => {

const mod = new Mod({
  x: req.body.x,
  y: req.body.y,
  model: req.body.model,
  shape: req.body.shape,
  notes: req.body.notes
});
mod.save((err) => {
  if (err) { return next(err); }
  req.flash('success', { msg: 'Module added' });
    res.redirect('/module');

});



// Mod.find({ x: req.body.x, y: req.body.y  }, (err, existingUser) => {
//   if (err) { return next(err); }
//   if (existingUser) {
//     req.flash('errors', { msg: 'Module Already Exists... Please edit instead' });
//     return res.redirect('/module');
//   }
//   mod.save((err) => {
//     if (err) { return next(err); }
//       res.redirect('/module');
//   });
// });
};

exports.postDeleteMod = (req, res, next) => {
  Mod.deleteOne({ _id: req.params.id }, (err) => {
    if (err) { return next(err); }
    req.flash('info', { msg: 'Module Removed.' });
    res.redirect('/module');
  });
};

exports.postUpdateMod = (req, res, next) => {

  Mod.findById(req.body.edit, (err, user) => {
    if (err) { return next(err); }
    mod.x = req.body.x || '';
    mod.y = req.body.y || '';
    mod.model = req.body.model || '';
    mod.shape = req.body.shape || '';
    mod.notes = req.body.notes || '';

    mod.save((err) => {
      if (err) {
        if (err) {}
        return next(err);
      }
      req.flash('success', { msg: 'updated.' });
      res.redirect('/module');
    });
  });
};

exports.postPlantLayout = (req, res, next) => {

  arr = [{}]
  IndividualPlant.insertMany(arr, function(error, docs) {});

//   Mod.find({ x: req.body.x, y: req.body.y }, (err, mod) => {
//     if (err) { return next(err); }
// // figure this out
//     for n in req.body.allPlants => {
//
//       Plant.findOne({ scientificName: req.body.xxx }, (err, mod) => {
//         if (err) { return next(err); }
//
//     const individualPlant = new IndividualPlant({
//       plant:
//       x: req.body.x, //how do you reference multiple items
//       y: req.body.y,
//       module: mod._id,
//       supplier: req.body.supplier,
//     });
//
//   individualPlant.save((err) => {
//     if (err) { return next(err); }
//   });
//   };
// });
};
