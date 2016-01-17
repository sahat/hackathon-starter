app.controller('appStatusCtrl', function ($scope, $rootScope) {
    $scope.user = $rootScope.user;
    $scope.user.campaignIds = [];
    $scope.appliedCampaigns = [];
    $scope.myApplications = [];

    $scope.selectedCampaign = {applications:[]};
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

    $scope.showCampaignStatus = function(id){
        $scope.apiClient.campaignCampaignIdApplicationGet({campaignId: id}, {}, {
            headers:{"Content-type": "application/json"}
        }).then(function(res){
            $scope.selectedCampaign.applications = res.data;
            $scope.$apply();
        });
    }

    $scope.apiClient.userUserIdApplicationGet({userId: $scope.user._id}, {}).then(function(res){
        $scope.myApplications = res.data;
        $scope.$apply();
        var cIds = [];
        if($scope.myApplications.length > 0){
            for (var i=0; i<$scope.myApplications.length; i++){
                cIds.push($scope.myApplications[i].campaignId);
            }
            $scope.apiClient.campaignGet({"count": 100, campaignIds: cIds.join(), ageRange: 0, numberOfFollowers: 0}, {}, {
                    headers:{"Content-type": "application/json"}
                }
            ).then(function(campaigns){
                    $scope.appliedCampaigns = campaigns.data;
                    $scope.$apply   ();
                }).catch(function(){
                    console.log("error");
                });
        }
    });
});