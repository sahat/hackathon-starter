var Logger = {
  incoming: function(message, callback) {
//    console.log('incoming', message);
    callback(message);
  },
  outgoing: function(message, callback) {
//    console.log('outgoing', message);
    callback(message);
  }
};

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

var uuid = guid();

var fayeClient = new Faye.Client('http://localhost:3000/faye',
			      {
				  timeout: 120,
				  retry : 10
			      });

fayeClient.subscribe("/"+id+"/add", fayeClient.handleMessage);
fayeClient.subscribe("/"+id+"/delete", fayeClient.handleMessage);
fayeClient.addExtension(Logger);

function generateCode(){
    local_data = local_data.slice(1,local_data.length - 1);
    local_data = local_data.replace(/&quot;/g,"'");
    return local_data;
}

chat.controller('UpdateCtrl', function($scope){
    $scope.updates = [];

    angular.element(document).ready(function(){
	var myCodeMirror = CodeMirror(document.getElementById("editor"), {
	    value: generateCode(),
	    lineNumbers: true,
	    matchBrackets: true,
	    mode:  "javascript"
	});

	myCodeMirror.on("change", function(cm, change) {

		var toSend = {
			source: uuid,
			fileId: id,
			from: change.from,
			to: change.to
    	};

	    switch(change.origin){

		    case "paste":
				toSend["text"] = change.text[0];
				fayeClient.publish("/"+id+"/add", toSend, function(err){
					console.log( "Error ",err );
			    });
				break;

		    case "cut":
				toSend["text"] = change.removed[0];
				fayeClient.publish("/"+id+"/delete", toSend, function(err){
					console.log( "Error ",err );
			    });
				break;

		    case "+input":
				toSend["text"] = change.text[0];
				fayeClient.publish("/"+id+"/add", toSend, function(err){
					console.log( "Error ",err );
			    });
				break;

		    case "+delete":
                toSend["text"] = change.removed[0];
				fayeClient.publish("/"+id+"/delete", toSend, function(err){
					console.log( "Error ",err );
			    });
				break;
		    default:
				break;
	    }
	});

    });

    var displayUpdates = function(){
	
    };
    
    fayeClient.handleMessage  = function(message){
    	if(id != message.clientId){
    	    displayUpdates();
    	}
    };

});

