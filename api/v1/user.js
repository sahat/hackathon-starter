'use strict';

var express = require('express');
var router = express.Router();
var User = require('../../models/User');

router.get('/', function(req, res, next){

    allPendingInvites(req, res);

});

router.get('/:userId', function(req, res, next){

    User.findById(req.params.userId, function(err, userProfile) {

        res.send({
            'user': {
                name: userProfile.profile.name
            }
        });

    });

});


module.exports = router;
