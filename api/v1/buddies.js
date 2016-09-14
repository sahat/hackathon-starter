'use strict';

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

router.get('/find/:buddyDetail', function(req, res, next){

    var detail = req.params.buddyDetail;
    console.log(detail)
    findBuddies(res, detail);

});

var allBuddiesOnline = function(req, res, status){

    User.findById(req.user.id, function(err, userProfile) {

        var searchCriteria = {
            "email": { $in : userProfile.buddies },
        };

        if(status){
            searchCriteria.status = status;
        }

        User.find(searchCriteria, {"status": 1, "email": 1 }, function(err, buddiesStatus){

            res.send({'buddies':buddiesStatus});

        });

    });

};

var findBuddies = function(res, detail){

    var searchCriteria = {
        "profile.name": new RegExp(detail, 'i')
    };

    User.find(searchCriteria, function(err, buddies) {

        res.send({'buddies':buddies});

    });

};

module.exports = router;
