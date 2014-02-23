var fayeClient = new Faye.Client('http://localhost:3000/faye',
			      {
				  timeout: 120,
				  retry : 10
			      });

fayeClient.subscribe("/"+id+"/add", fayeClient.handleMessage);
fayeClient.subscribe("/"+id+"/delete", fayeClient.handleMessage);
debugger;
chat.controller('UpdateCtrl', function($scope){
    $scope.updates = [];

    var displayUpdates = function(){
	console.log( "updates ",$scope.updates );
    };
    
    fayeClient.handleMessage  = function(message){
	$scope.updates.append(message);
	displayUpdates();
    };

    myCodeMirror.on("change", function(cm, change){
	console.log( change );
	//Add if statement to check event
	fayeClient.publish("/"+id+"/add", function(err){
	    console.log( "Error ",err );
	});
    });
});

