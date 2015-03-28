var User = require('../models/User');

exports.getMobileNumberForUsers = function(userIds, callback) {
	var query = User
	.find({'_id': { $in: userIds}})
	.select('profile.mobileNumber')
	.exec(callback);
};