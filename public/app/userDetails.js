app.controller('userDetailsCtrl', function ($scope, $uibModal, $rootScope, $routeParams, $http) {
    var userId = $routeParams.userId;
    $scope.userDetails = {};
    $scope.fbStats = {};
    $scope.loadedFbData = false;
    $scope.totalFollowerNum = 1;
    $scope.totalLocationNum = 1;


    $http.get('/userDetails/'+ userId).then(function(res){
        $scope.userDetails = res.data || {}
    }, function(res){
        $rootScope.alerts.push({type:"danger", msg:"Cannot get user's profile."});

    });

    $http.get('/userFacebookInsight/' + userId + "/").then(function(res){
        $scope.fbStats = JSON.parse(res.data.body) || {};
        if(!$scope.fbStats.errorMessage){
            angular.forEach($scope.fbStats.age, function(value, key){
                $scope.totalFollowerNum += value;
            });
            angular.forEach($scope.fbStats.location, function(value,key){
                $scope.totalLocationNum += value;
            });
            $scope.loadedFbData = true;
        } else {
            $rootScope.alerts.push({type:"danger", msg:"Cannot get user's Facebook Data"});
        }
    })
});

