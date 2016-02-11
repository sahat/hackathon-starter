app.controller('profileCtrl', function ($rootScope, $scope, $http) {
    $scope.user = $rootScope.user;
    $scope.fbStats = {age: {}, gender:{male:1, female:1}};
    $scope.loadedFbData = false;
    $scope.chartOption = {
        chart: {
            type: 'pieChart',
            height: 500,
            x: function(d){return d.key;},
            y: function(d){return d.y;},
            showLabels: true,
            duration: 500,
            labelThreshold: 0.01,
            labelSunbeamLayout: true,
            legend: {
                margin: {
                    top: 5,
                    right: 35,
                    bottom: 5,
                    left: 0
                }
            }
        }
    };
    $scope.chartData = [
        {
            key: "One",
            y: 5
        },
        {
            key: "Two",
            y: 2
        },
        {
            key: "Three",
            y: 9
        },
        {
            key: "Four",
            y: 7
        },
        {
            key: "Five",
            y: 4
        },
        {
            key: "Six",
            y: 3
        },
        {
            key: "Seven",
            y: .5
        }
    ];

    if($scope.user.profile.facebookDefaultPageId != '' ){
        var fbToken = '';
        var index;
        for(var i=0; i<$scope.user.tokens.length; i++){
            if($scope.user.tokens[i].kind == 'facebook'){
                fbToken = $scope.user.tokens[i].accessToken;
                index = i;
                break;
            }
        }
        $scope.apiClient.facebookGet({accessToken: fbToken, postId: "", pageId: $scope.user.profile.facebookDefaultPageId}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(res){
            if(!res.data.errorMessage){
                if(res.data.age){
                    $scope.totalFollowerNum = 0;
                    angular.forEach(res.data.age, function(value, key){
                        $scope.totalFollowerNum += value;
                    });
                }
                $scope.loadedFbData = true;
                $scope.fbStats = res.data;
                $scope.$apply();
            } else {
                $http.get('/extendFbToken/' + fbToken, {}).then(function(res){
                    if(!res.data.message){
                        $scope.user.tokens[index].accessToken = res.data.newToken;
                            $http.post("/account/profile", $scope.user, {headers:{"Content-type": "application/json"}
                            });
                        $scope.apiClient.facebookGet({accessToken: $scope.user.tokens[index].accessToken, postId: "", pageId: $scope.user.profile.facebookDefaultPageId}, {}, {
                                headers:{"Content-type": "application/json"}
                            }
                        ).then(function(res){
                                $scope.fbStats = res.data;
                                $scope.loadedFbData = true;
                                $scope.$apply();

                            });
                    }
                });
            }
        });
    }
});