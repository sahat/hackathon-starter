var mongoose = require('mongoose');
var Workout = mongoose.model('Workout');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};
