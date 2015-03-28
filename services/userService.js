var User = require('../models/User');

exports.getMobileNumberForUsers = function(userIds, callback) {
	User
	.find({'_id': { $in: userIds}})
	.select({_id : false, 'profile.mobileNumber': true})
	.exec(callback);
};