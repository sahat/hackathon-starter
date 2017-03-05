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

  User.findById(formJson.q10_applicantid,  function(err, user) {
    if(user) {
        vr = user.details;
        if(!vr) {
          return res.status(500);
        }

        vr.rawFormData = req.body.rawRequest;
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
