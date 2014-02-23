$(document).ready(function(){

	function generateCode(){
		var val = "function myScript(){" +
			"\n\treturn 100;" +
			"\n}";				
		return val;
	}

	var data = new FormData();
	data.append("thing", "thing");
	console.log(data);

	var myCodeMirror = CodeMirror(document.getElementById("editor"), {
		value: generateCode(),
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript"
	});

    var chat = angular.module('Chat', ['goangular']);
    chat.config(function($goConnectionProvider) {
	    //TODO replace with app.locals.connectUrl
            $goConnectionProvider.$set('https://goinstant.net/e106cb106c84/mchacks');
	});
    chat.controller('ChatCtrl', function($scope, $goKey) {
            $scope.messages = $goKey('messages').$sync();

            $scope.messages.$on('add', {
		local: true,
		listener: scrollOn
            });

            $scope.messages.$on('ready', scrollOn);

            $scope.sendMessage = function() {
		if(!$scope.newMessage) {
		    return;
		}

		$scope.messages.$add({
		    content: $scope.newMessage,
		    author: $scope.author
		}).then(function() {
		    $scope.$apply(function() {
			$scope.newMessage = '';
		    });
		});
            };

            function scrollOn() {
		setTimeout(function() {
		    $('.table-wrapper').scrollTop($('.table-wrapper').children().height());
		}, 0);
            }
	});

});
