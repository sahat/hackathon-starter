app.controller('profileCtrl', function ($rootScope, $scope, $http) {
    $scope.user = $rootScope.user;


    if($scope.user.profile.facebookDefaultPageId != '' ){
        var fbToken = '';
        for(var i=0; i<$scope.user.tokens.length; i++){
            if($scope.user.tokens[i].kind == 'facebook'){
                fbToken = $scope.user.tokens[i].accessToken;
            }
        }
        $scope.apiClient.insightsFacebookGet({accessToken: fbToken, pageId: $scope.user.profile.facebookDefaultPageId}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(res){
            $scope.fbStats = res.data;
            $scope.$apply();
        });
    }
});