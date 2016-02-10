app.controller('performanceCtrl', function ($scope, $http, $rootScope) {
    $scope.selectedCampaign = {};
    $scope.completedCampaigns = [];
    $scope.getMyCampaigns = function(){
        $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0, startKey: "", tags: ""}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(campaigns){
                angular.forEach(campaigns.data, function(campaign){
                    if(campaign.status === "completed"){
                        $scope.completedCampaigns.push(campaign);
                    }
                });
                $scope.$apply();
            }).catch(function(){
                console.log("error");
            });
    };
    if($scope.user.campaignIds && $scope.user.campaignIds.length > 0){
        $scope.getMyCampaigns();
    }
    $scope.getPostStats = function(campaign){
        $scope.selectedCampaign = campaign;
        $scope.apiClient.campaignCampaignIdApplicationGet({campaignId: campaign.campaignId}, {}, {
            headers:{"Content-type": "application/json"}
        }).then(function(res){
                $scope.selectedCampaign.completedApplications = [];
                var users = {};
                angular.forEach(res.data, function(apply){
                    if(apply.status === 'completed'){
                        $http.get('/userFacebookInsight/' + apply.userId + "/" + apply.facebookPostId).then(function(res){
                            if(!res.data.errorMessage){
                                var fbStats = JSON.parse(res.data.body);
                                apply.fbStats = fbStats;
                                angular.forEach(fbStats.age, function(value, key){
                                    apply.fbStats.totalFollowerNum += value;
                                });
                                angular.forEach(fbStats.location, function(value,key){
                                    apply.fbStats.totalLocationNum += value;
                                });
                                apply.loadedFbData = true;
                                $scope.selectedCampaign.completedApplications.push(apply);
                            } else {
                                $rootScope.alerts.push({type:"danger", msg:"Failed to load all post performance"});
                            }
                        })
                    }
                });
                $scope.$apply();
            });
    }
});