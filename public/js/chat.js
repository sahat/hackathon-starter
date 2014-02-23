var chat = angular.module('Chat', ['goangular']);
console.log( 'chat',chat );
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
