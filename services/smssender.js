
var Client = require('node-rest-client').Client;
var app_id = "Ulr2j9A6YBS2RuB6";
var auth_token = "8zuvJweRdJyobWjW";
var sms_send_url = "https://secure.hoiio.com/open/sms/send"

var client = new Client();

/**
	construct the sms sender RESTful URL and call hoiio sms API to send sms.
	https://secure.hoiio.com/open/sms/send?dest=%2B6592300290&msg=Hoiio+World&access_token=8zuvJweRdJyobWjW&app_id=Ulr2j9A6YBS2RuB6
*/
exports.sendSms = function(number, message){

	var args ={      
        parameters:{dest:number, msg:message, access_token: auth_token, app_id: app_id}, // query parameter substitution vars 
      };

	//var uri = sms_send_url + '?' + 'dest=' + number + '&msg=' + message + '&access_token=' + auth_token + '&app_id=' + app_id
	client.get(sms_send_url, args,  function(data, response){           
           console.log('sems sent for ' + number);
	});
};

