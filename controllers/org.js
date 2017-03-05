var VettRecord = require('../models/VettRecord');
var User = require('../models/User');

exports.viewApplicants = function (req, res) {
  VettRecord.find({}).
    populate('user').
    exec(function (err, docs) {
    console.error(docs);
    res.send(docs);
  });
};

exports.viewApproved = function (req, res) {
  VettRecord.find({vettStatus:1}).
    populate('user').
    exec(function (err, docs) {
    console.error("HI");
    console.error(docs);
    res.send(docs);
  });
};

exports.postFormWebhook = function(req, res) {
  var formJson = JSON.parse(req.body.rawRequest);

  User.findById(formJson.q10_applicantid,  function(err, userInfo) {
    if(userInfo) {
      VettRecord.findOne({user: userInfo._id}, function(err, vr) {
        if(vr) {
          console.log("Found VR: " + vr);
          vr.rawFormData = req.body.rawRequest;
          console.log("Updated VR: " + vr);
          vr.save(function(err) {
            if(err) {
              console.log(err);
              return res.status(500);
            } else {
              return res.status(200);
            }
          });
        } else {
          console.log("NO VR OBJECT!!!");
          return res.status(500);
        }
      });
    }
  });
}

exports.updateVettRecord = function (req, res) {
  var vRec = req.body.vettRecord;
  var query = { "_id": vRec._id };
  console.error("UPDATE", vRec);
  VettRecord.findOneAndUpdate(query, vRec, {upsert:true}, function(err, doc){
    console.error("OOOUPDATE");
    console.error(doc);
    if (err) return res.send(500, { error: err });
    res.send(JSON.stringify(doc));
  });
};
