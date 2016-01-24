app.controller('campaignDetailsCtrl', function ($scope, $uibModal, $rootScope, $routeParams, $http) {
    var id = $routeParams.id;
    var showForm = $routeParams.showForm || false;

    $scope.myCampaigns = [];
    $scope.showAppForm = showForm;
    $scope.submittedForm = false;
    $scope.apiClient.campaignGet({"count": 1, campaignIds: id, ageRange: 0, numberOfFollowers: 0, startKey: "", tags: ""}, {}, {
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
//    $scope.user.campaignIds = ["ebada479-9945-46c4-89bb-02a0fa81729f", "ce0d570a-92db-4f76-b21a-326404c5fd76"]
    if($scope.user.campaignIds.length > 0){
        $scope.apiClient.campaignGet({"count": 100, campaignIds: $scope.user.campaignIds.join(), ageRange: 0, numberOfFollowers: 0}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(campaigns){
                $scope.myCampaigns = campaigns.data;
                $scope.$apply   ();
            }).catch(function(){
                console.log("error");
            });
    }
    $scope.appForm = {
        reason: "",
        "userId": $rootScope.user._id,
        "campaignId": id,
        "applicationId": generateUUID(),
        "postContent": "",
        "pageId": ""
    }

    $scope.pageList = [];
    if($rootScope.fbToken){
        $scope.apiClient.insightsFacebookPagesGet({"accessToken": $rootScope.fbToken}, {}, {
                headers:{"Content-type": "application/json"}
            }
        ).then(function(res){
                $scope.pageList = res.data.data;
                $scope.appForm.pageId = $scope.pageList[0].id;
                $scope.$apply();
            }).catch(function(){
                console.log("Cannot get pages ");
            });
    }
    $scope.submitAppForm = function(){
        if ($scope.appForm.reason !='' && $scope.appForm.postContent !=''){
            $scope.apiClient.campaignCampaignIdApplicationPost({campaignId: id}, $scope.appForm, {
                    headers:{"Content-type": "application/json"}
                }
            ).then(function(res){
                 $rootScope.alerts.push({type:"success", msg:"Successfully applied to campaign."});
                    $scope.submittedForm = true;
                    $scope.$apply();
                }).catch(function(res){
                    $rootScope.alerts.push({type:"danger", msg:"Successfully applied to campaign."});
                    $scope.$apply();
                });
        }
    }

});

