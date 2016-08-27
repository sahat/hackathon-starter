var express = require('express');
var router = express.Router();
var User = require('../../models/User');

router.get('/', function(req, res, next){

   allBuddiesOnline(req, res);

});

router.get('/ready', function(req, res, next){

    allBuddiesOnline(req, res, "ready");

});

router.get('/notready', function(req, res, next){

    allBuddiesOnline(req, res, "not");

});

var allBuddiesOnline = function(req, res, status){

    User.findById(req.user.id, function(err, userProfile) {

        var searchCriteria = {
            "email": { $in : userProfile.buddies }
        };

        if(status){
            searchCriteria.status = status;
        }

        User.find(searchCriteria, {"status": 1, "email": 1 }, function(err, buddiesStatus){

            console.log(buddiesStatus);
            res.send(buddiesStatus);

        });

    });

};


module.exports = router;
