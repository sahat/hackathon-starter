var Event = require('../models/Event');
var User = require('../models/User');

exports.addEvent = function(eventId, userId, callback) {
  User.findById(userId, function(err) {
    if (err) return next(err);

    Event.update({_id : eventId}, {$push: {participants: userId}}, function(err) {
      if (err) return next(err);

      User.update({_id : userId}, {$push: {events: eventId}}, function(err) {
        if (err) return next(err);
        callback({ message: 'Event Successfully Added' });
      });
    });
      
  }); 
};

exports.removeEvent = function(eventId, userId, callback) {
  Event.update({_id : eventId}, {$pull: {participants: userId}}, function(err) {
    if (err) return next(err);

    User.update({_id : userId}, {$pull: {events: eventId}}, function(err) {
      if (err) return next(err);
      callback({ message: 'Event Successfully Removed' });
    });
  });
};
