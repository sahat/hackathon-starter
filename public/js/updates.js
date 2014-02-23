var Logger = {
  incoming: function(message, callback) {
    console.log('incoming', message);
    callback(message);
  },
  outgoing: function(message, callback) {
    console.log('outgoing', message);
    callback(message);
  }
};

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
	    fayeClient.publish("/"+id+"/add", change, function(err){
		console.log( "Error ",err );
	    });

	    switch(change.origin){
	    case "paste":
		console.log("Pasted");
		console.log(change.from);
		console.log(change.from.line);
		console.log(change.text[0]);
		break;
	    case "cut":
		console.log("cut");
		break;
	    case "+input":
		console.log("input");
		console.log(change.from);
		console.log(change.text[0]);
		break;
	    case "+delete":
		console.log("delete");
		break;
	    default:
		break;
	    }
	});

    });

    var displayUpdates = function(){
	console.log( "updates ",$scope.updates );
    };
    
    fayeClient.handleMessage  = function(message){
	$scope.updates.append(message);
	displayUpdates();
    };

});

