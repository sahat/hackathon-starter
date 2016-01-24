app.controller('appStatusCtrl', function ($scope, $rootScope, $http) {
    $scope.user = $rootScope.user;
    $scope.appliedCampaigns = [];
    $scope.myApplications = [];
    $scope.maxDate = new Date(2016, 2, 23);
    $scope.minDate = new Date();

    $scope.getMyCampaigns = function(){
        $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0, startKey: "", tags: ""}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(campaigns){
                $scope.campaigns = campaigns.data;
                $scope.$apply   ();
            }).catch(function(){
                console.log("error");
            });
    };

    $scope.selectedCampaign = {applications:[]};
    if($scope.user.campaignIds.length > 0){
        $scope.getMyCampaigns();
    }

    $scope.showCampaignStatus = function(id){
        $scope.apiClient.campaignCampaignIdApplicationGet({campaignId: id}, {}, {
            headers:{"Content-type": "application/json"}
        }).then(function(res){
//                angular.forEach(res.data, function(application){
//                    application.actionTime = new Date();
//                });
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
            $scope.apiClient.campaignGet({"count": 100, campaignIds: cIds.join(), ageRange: 0, numberOfFollowers: 0, startKey:"", tags: ""}, {}, {
                    headers:{"Content-type": "application/json"}
                }
            ).then(function(campaigns){
                    $scope.appliedCampaigns = campaigns.data;
                    angular.forEach($scope.appliedCampaigns, function(campaign){
                        for(var i=0; i<$scope.myApplications.length; i++){
                            if(campaign.campaignId == $scope.myApplications[i].campaignId){
                                campaign.application =  $scope.myApplications[i];
                                break;
                            }
                        }
                    });
                    $scope.$apply   ();
                }).catch(function(){
                    console.log("error");
                });
        }
    });

    $scope.acceptApply = function(application){
        application.status = 'accepted';
        var actionTime = new Date();
        actionTime.setDate(application.date.getDate());
        actionTime.setHours(application.time.getHours());
        actionTime.setMinutes(application.time.getMinutes());
        var newApply = {
            actionTime: actionTime,
            campaignId:application.campaignId,
            applicationId: application.applicationId,
            status: 'accepted',
            reason: application.reason,
            userId: application.userId,
            message: application.message,
            pageId: application.pageId
        }
       $scope.apiClient.applicationApplicationIdPatch({applicationId: application.applicationId}, newApply).then(function(res){
           $rootScope.alerts.push({type:"success", msg:"Successfully accepted application"});
           $scope.$apply();
           $scope.selectedCampaign.applications = [];
           $scope.getMyCampaigns();
       });
    }

    $scope.confirmPostTime = function(campaign){
        //TODO: set application status to close
        $http.post('/api/scheduleFBPost', {
            applicationId: campaign.application.applicationId,
            pageId: campaign.application.pageId,
            actionTime: campaign.application.postTime,
            pageAccessToken: "",
            message: campaign.application.message
        }, {header: {"Content-type": "application/json"}}).then(function(res){
                $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
                campaign.application.status = "completed";
                $scope.apiClient.campaignCampaignIdApplicationPatch({campaignId: application.campaignId}, campaign.application).then(function(res){
                    $scope.$apply();
                });
            });
    };
});