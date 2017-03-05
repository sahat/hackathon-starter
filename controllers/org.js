var VettRecord = require('../models/VettRecord');

exports.viewApplicants = function (req, res) {
  VettRecord.find({}).
    populate('user').
    exec(function (err, docs) {
    console.log(docs);
    res.send(docs);
  });
};

exports.updateVettRecord = function (req, res) {
  var vRec = req.body.vettRecord;
  var query = { "_id": vRed._id };
  VettRecord.findOneAndUpdate(query, vRec, {upsert:true}, function(err, doc){
    if (err) return res.send(500, { error: err });
    res.sendStatus(200);
  });
};
