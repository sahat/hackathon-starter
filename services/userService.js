var User = require('../models/User');

exports.getMobileNumberForUsers = function(userIds, callback) {
	var query = User
	.find({'_id': { $in: userIds}})
	.select({_id : false, 'profile.mobileNumber': true})
	.exec(callback);
};