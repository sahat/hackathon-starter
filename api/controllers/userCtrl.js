// controller file for users
var mongoose = require('mongoose');
var User = mongoose.model('User');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

module.exports.getUserById = function(req, res) {
    console.log('reading one user');
    console.log('Finding user details', req.params);
    if (req.params && req.params.userid) {
        User
            .findById(req.params.userid)
            .exec(function(err, user) {
                if (!user) {
                    sendJsonResponse(res, 404, {
                        "message": "userid not found"
                    });
                    return;
                } else if (err) {
                    console.log(err)
                    sendJsonResponse(res, 404, err);
                    return;
                }
               // console.log(user)
                sendJsonResponse(res, 200, user);
            });
    } else {
        console.log('No userid specified');
        sendJsonResponse(res, 404, {
            "message": "No userid in request"
        });
    }
};

module.exports.getAllUsers = function(req, res) {
    console.log('reading all users');
    User
        .find() // finds all the users
        .exec(function(err, user) {
            if (!user) {
                sendJsonResponse(res, 404, {
                    "message": "no users found"
                });
                return;
            } else if (err) {
                console.log(err)
                sendJsonResponse(res, 404, err);
                return;
            }
            sendJsonResponse(res, 200, user);
        });
};