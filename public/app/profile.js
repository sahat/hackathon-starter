app.controller('profileCtrl', function ($rootScope, $scope) {
    $scope.user = $rootScope.user;

    if($scope.user.campaignIds.length > 0){
        $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(campaigns){
                $scope.campaigns = campaigns.data;
                $scope.$apply   ();
            }).catch(function(){
                console.log("error");
            });
    }
});