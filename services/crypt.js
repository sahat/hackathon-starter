var crypto = require('crypto');
var secrets = require('../config/secrets');

exports.encrypt = function(text){
	var cipher = crypto.createCipher(secrets.cryptAlgorithm, secrets.cryptPassword)
		var crypted = cipher.update(text, 'utf8', 'hex')
		crypted += cipher.final('hex');
	return crypted;
}

exports.decrypt = function(text){
	var decipher = crypto.createDecipher(secrets.cryptAlgorithm, secrets.cryptPassword)
		var dec = decipher.update(text, 'hex', 'utf8')
		dec += decipher.final('utf8');
	return dec;
}

exports.generateToken = function(callback) {
	crypto.randomBytes(16, function(err, buf) {
		var token = buf.toString('hex');
		callback(err, token);
	});
}
