var eventService = require('./eventService');
var smsSender = require('./smssender');
var userService = require('./userService');

/**
*Send sms reminders to ther subscribed users about the event.
*/
exports.remind = function(){
	var currentDate = new Date();
	currentDate.setDate(currentDate.getDate() + 1);
	var tomorrow = currentDate;
	var startTime = new Date(tomorrow.getTime());
	var endTime = new Date(tomorrow.getTime());

	endTime.setHours(23, 59, 59);
	startTime.setHours(0, 0, 0, 0);
	


	console.log("startDate " + startTime + "  endDate : " + endTime);
	eventService.getEventsByCriteria(null, null, startTime.getTime(), endTime.getTime(), null, false, null, null, function(err, events){
		console.log("event search result found" + err + events);
		if(events){
			console.log("event list size : " + events.length);
			for (var i = 0; i < events.length; i++) {
				sendMessageForEvent(events[i]);				
			};
		}
	});
};


/*sms send logic for generic event*/
function sendMessageForEvent(event){
	var eventName = event.title;
	var participantList = event.participants;
	var eventDate = new Date(event.eventDate);
	//get phone numbers for user
	userService.getMobileNumberForUsers(participantList, function(err, phoneNumberList){
		var smsContent = "You have " + eventName + " tomorrow.";
		if(phoneNumberList.length > 0){
			for(var i = 0; i < phoneNumberList.length; i++){
				smsSender.sendSms(phoneNumberList[i].profile.mobileNumber, smsContent);
			}

			event.isRemind = true;
			eventService.saveEvent(event, function(err){});
		}		

	});
}	
