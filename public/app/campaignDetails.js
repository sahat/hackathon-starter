app.controller('campaignDetailsCtrl', function ($scope, $uibModal, $rootScope, $routeParams, $http) {
    var id = $routeParams.id;

    $scope.apiClient.campaignGet({"count": 1, campaignIds: id, ageRange: 0, numberOfFollowers: 0}, {}, {
            headers:{"Content-type": "application/json"}
        }
    ).then(function(campaigns){
            $scope.campaign = campaigns.data[0];
            $scope.$apply   ();
                $http.get('/userDetails/'+ campaigns.data[0].userId).then(function(res){
                    if(res.data){
                        $scope.ownerPic = res.data.profile.picture;
                        $scope.ownerName = res.data.profile.name;
                    }
                });
        }).catch(function(){
            console.log("error");
        });

//    $http.get('/userDetails', { params: {id: $scope.user._id}}).then(function(res){
//        if(res.data){
//            $scope.ownerPic = res.data;
//
//        }
//    });


});

