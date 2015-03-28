var Event = require('../models/Event');
var User = require('../models/User');
var eventService = require('../services/eventService');

exports.addEvent = function(eventId, userId, callback) {
  User.findById(userId, function(err) {
    if (err) return callback(err);

    Event.update({_id : eventId}, {$push: {participants: userId}}, function(err) {
      if (err) return callback(err);

      User.update({_id : userId}, {$push: {events: eventId}}, function(err) {
        if (err) return callback(err);
        callback({ message: 'Event Successfully Added' });
      });
    });
      
  }); 
};

exports.removeEvent = function(eventId, userId, callback) {
  Event.update({_id : eventId}, {$pull: {participants: userId}}, function(err) {
    if (err) return callback(err);

    User.update({_id : userId}, {$pull: {events: eventId}}, function(err) {
      if (err) return callback(err);
      callback({ message: 'Event Successfully Removed' });
    });
  });
};

exports.getEventsForUser = function(userId, callback) {
  User.findById(userId, function(err, user) {
      if (err) callback(err);
      var from = new Date().getTime();
      if (user.events || user.events.length == 0) {
        callback(null, []);
      } else {
        eventService.findEventsById(user.events, from, callback);
      }
      
  });
};