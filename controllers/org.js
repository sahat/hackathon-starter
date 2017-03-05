var VettRecord = require('../models/VettRecord');
var User = require('../models/User');

exports.viewApplicants = function (req, res) {
  VettRecord.find({}).
    populate('user').
    exec(function (err, docs) {
    console.log(docs);
    res.send(docs);
  });
};

exports.postFormWebhook = function(req, res) {
  var formJson = JSON.parse(req.body.rawRequest);

  User.findById(formJson.q9_comments,  function(err, user) {
    if(user) {
        var vr = user.details;
        if(!vr) {
          return res.status(500);
        }

        console.log("VR object: ");
        console.log(vr);
        console.log('----------');
        vr.rawFormData = req.body.rawRequest;
        console.log(vr);
        vr.save(function(err) {
          if(err) {
            console.log(err);
            return res.status(500);
          } else {
            return res.status(200);
          }
        });
    }
  });
}

exports.updateVettRecord = function (req, res) {
  var vRec = req.body.vettRecord;
  var query = { "_id": vRed._id };
  VettRecord.findOneAndUpdate(query, vRec, {upsert:true}, function(err, doc){
    if (err) return res.send(500, { error: err });
    res.sendStatus(200);
  });
};
