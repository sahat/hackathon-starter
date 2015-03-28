var Event = require('../models/Event');
var User = require('../models/User');
var mongoose = require('mongoose');


exports.addEventForCurrentUser = function(req, res, next) {
  var userId = req.params.userId || req.user.id;
  User.findById(userId, function(err) {
    if (err) return next(err);

    Event.update({_id : req.params.eventId}, {$push: {participants: userId}}, function(err) {
      if (err) return next(err);

      User.update({_id : userId}, {$push: {events: req.params.eventId}}, function(err) {
        if (err) return next(err);
        res.json({ message: 'Event Successfully Added' });
      });
    });
      
  }); 
};

exports.removeEventFromCurrentUser = function(req, res, next) {   
  Event.update({_id : req.params.eventId}, {$pull: {participants: req.user.id}}, function(err) {
    if (err) return next(err);

    User.update({_id : req.user.id}, {$pull: {events: req.params.eventId}}, function(err) {
      if (err) return next(err);
      res.json({ message: 'Event Successfully Removed' });
    });
  });
};