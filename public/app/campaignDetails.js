app.controller('campaignDetailsCtrl', function ($scope, $uibModal, $rootScope, $routeParams, $http) {
    var id = $routeParams.id;
    var showForm = $routeParams.showForm || false;

    $scope.myCampaigns = [];
    $scope.showAppForm = showForm;
    $scope.submittedForm = false;
    $scope.apiClient.campaignGet({"count": 1, campaignIds: id, ageRange: 0, numberOfFollowers: 0, startKey: "", tags: "", status: ""}, {}, {
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

    $scope.getMyCampaigns = function(){
        if($scope.user.campaignIds.length > 0 && $scope.myCampaigns < 1){
            $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0, startKey: "", tags: "", status: ""}, {}, {
                    headers:{"Content-type": "application/json"}
                }
            ).then(function(campaigns){
                    $scope.myCampaigns = campaigns.data;
                    $scope.$apply   ();
                }).catch(function(){
                    console.log("error");
                });
        }
    };
    if($scope.user.campaignIds.length > 0){
        $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0, startKey: "", tags: "", status: ""}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(campaigns){
                $scope.myCampaigns = campaigns.data;
                $scope.$apply   ();
            }).catch(function(){
                console.log("error");
            });
    }
//    $scope.appForm = {
//        applicationId: generateUUID(),
//        applicant: {
//            userId: $rootScope.user._id,
//            postContent: "",
//            requirements: "",
//            campaignId: "",
//            pageId: "",
//            reasons:""
//        },
//        owner: {
//            campaignId: id,
//            userId: ""
//        }
//    }
    $scope.appForm = {
        applicationId: generateUUID(),
        userId: $rootScope.user._id,
        postContent: "",
        requirements: "",
        applicantCampaignId: "",
        facebookPageId: "",
        reasons: "",
        campaignId: id,
        ownerUserId: ""
    }

    $scope.pageList = [];
    if($rootScope.fbToken){
        $scope.apiClient.insightsFacebookPagesGet({"accessToken": $rootScope.fbToken}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(res){
                $scope.pageList = res.data.data;
                $scope.appForm.facebookPageId = $scope.pageList[0].id;
                $scope.$apply();
            }).catch(function(){
                console.log("Cannot get pages ");
            });
    }
    $scope.submitAppForm = function(){
        $scope.appForm.ownerUserId = $scope.campaign.userId;
        if ($scope.appForm.reasons !='' && $scope.appForm.postContent !=''){
            $scope.apiClient.campaignCampaignIdApplicationPost({campaignId: id}, $scope.appForm, {
                    headers:{"Content-type": "application/json"}
                }
            ).then(function(res){
                 if(!res.data.errorMessage){
                     $rootScope.alerts.push({type:"success", msg:"Successfully applied to campaign."});
                     $scope.submittedForm = true;
                 } else {
                     $rootScope.alerts.push({type:"danger", msg:"Failed to apply to campaign."});
                 }
                    $scope.$apply();


                }).catch(function(res){
                    $rootScope.alerts.push({type:"danger", msg:"Failed to apply to campaign."});
                    $scope.$apply();
                });
        }
    }

});

