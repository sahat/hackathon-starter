var VettRecord = require('../models/VettRecord');

exports.viewApplicants = function (req, res) {
  VettRecord.find({}).
    populate('user').
    exec(function (err, docs) {
    console.log(docs);
    res.send(docs);
  });
};
