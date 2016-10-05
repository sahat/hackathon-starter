'use strict';

var express = require('express');
var router = express.Router();
var User = require('../../models/User');

router.get('/', function(req, res, next){

    allPendingInvites(req, res);

});

router.post('/', function(req, res, next){

    var user = User.findById(req.body.buddyId, function(err, userProfile) {

        userProfile.coffeeSession.directInvites.push({
            buddyId: req.user.id
        });

        userProfile.save(function (err) {
            let responseMessage = 'Buddy request sent.';
            if (!err) {
                responseMessage = 'There was a problem sending your buddy request.'
            }
            res.send({'message':responseMessage});
        });

    });

});

router.post('/addToGroup', function(req, res, next){

    var user = User.findById(req.body.buddyId, function(err, userProfile) {

        userProfile.coffeeSession.directInvites.push({
            buddyId: req.user.id
        });

        userProfile.save(function (err) {
            let responseMessage = 'Buddy request sent.';
            if (!err) {
                responseMessage = 'There was a problem sending your buddy request.'
            }
            res.send({'message':responseMessage});
        });

    });

});

var allPendingInvites = function(req, res){

    User.findById(req.user.id, function(err, userProfile) {

        res.send({'invites':userProfile.coffeeSession});

    });

};

module.exports = router;
