'use strict';

var express = require('express');
var router = express.Router();
var User = require('../../models/User');

router.get('/', function(req, res, next){

   allBuddiesOnline(req, res);

});

router.get('/ready', function(req, res, next){

    allBuddiesOnline(req, res);

});

//router.get('/notready', function(req, res, next){
//
//    allBuddiesOnline(req, res, "not");
//
//});

router.get('/pendingRequests', function(req, res, next){

    User.findById(req.user.id, function(err, userProfile) {
console.log(userProfile)
        User.find({"_id": { $in : userProfile.buddyRequests }}, {"profile.name":1, "email":1} ,function(err, allBuddies){

            res.send({'buddies':allBuddies});

        });

    });

});

router.get('/find/:buddyDetail', function(req, res, next){

    var detail = req.params.buddyDetail;

    findBuddies(res, detail);

});

var allBuddiesOnline = function(req, res){

    User.findById(req.user.id, function(err, userProfile) {

        User.find({"_id": { $in : userProfile.buddies }}, {"profile.name":1, "email":1} ,function(err, allBuddies){

            res.send({'buddies':allBuddies});

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
