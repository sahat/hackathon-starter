var VettRecord = require('../models/VettRecord');

exports.viewApplicants = function (req, res) {
  VettRecord.find({}, function (err, docs) {
    console.log(docs);
    res.send(docs);
  });
};
