app.controller('appStatusCtrl', function ($scope, $rootScope, $http) {
    $scope.user = $rootScope.user;
    $scope.appliedCampaigns = [];
    $scope.myApplications = [];
    $scope.maxDate = new Date();
    $scope.maxDate.setDate($scope.maxDate.getDate()+60);          //limit schedule to within 60 days
    $scope.minDate = new Date();
    $scope.selectedApply = {};

//    My Campaigns Tab
    $scope.selectedCampaign = {applications:[]};
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
    if($scope.user.campaignIds.length > 0){
        $scope.getMyCampaigns();
    }
    //Get fb page list for accepting applications
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

    $scope.showCampaignStatus = function(id){
        $scope.apiClient.campaignCampaignIdApplicationGet({campaignId: id}, {}, {
            headers:{"Content-type": "application/json"}
        }).then(function(res){
//                angular.forEach(res.data, function(application){
//                    application.actionTime = new Date();
//                });
                $scope.selectedCampaign.applications = res.data;
                var users = {};
                angular.forEach($scope.selectedCampaign.applications, function(apply){
                    if(apply.userId){
                        $http.get('/userDetails/'+ apply.userId).then(function(res){
                            if(res.data){
                                if(users[res.data._id]){
                                    apply.applicantProfile = users[res.data._id];
                                } else {
                                    apply.applicantProfile = res.data.profile;
                                    users[res.data._id] = res.data.profile;
                                }
                            }
                        });
                    }
                    if(!apply.ownerPostContent && !apply.ownerPageId){
                        angular.extend(apply, {ownerPostContent: "", ownerPageId:""});
                    }
                });
            $scope.$apply();
        });
    };

    $scope.acceptApply = function(application){
        application.status = 'accepted';
        var actionTime = new Date();
        actionTime.setDate(application.date.getDate());
        actionTime.setHours(application.time.getHours());
        actionTime.setMinutes(application.time.getMinutes());
        var newApply = {
            applicationId: application.applicationId,
            status: 'accepted',
            actionTime:actionTime.getTime()+""
        };
        angular.extend(newApply, application);

        delete newApply.applicantProfile;
        delete newApply.date;
        delete newApply.isCalendarOpened;
        delete newApply.time;
        delete newApply.updateTime;
        delete newApply.createTime;

        $scope.apiClient.applicationApplicationIdPatch({applicationId: application.applicationId}, newApply).then(function(res){
            $rootScope.alerts.push({type:"success", msg:"Successfully accepted application"});
            $scope.$apply();
            $scope.selectedCampaign.applications = [];
            $scope.getMyCampaigns();
        });
    };

    $scope.ownerSchedulePosts = function(application){
        $http.get('/extendFbToken/' + $rootScope.fbToken, {}).then(function(res){
            if(!res.data.message){
                $rootScope.fbToken = res.data.newToken;
                application.ownerAccessToken = $rootScope.fbToken;
                //schedule posts
                $http.post("/api/scheduleFacebookPosts", {"application": application}, {headers:{"Content-type": "application/json"}}).then(function(res){
                    $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
                    application.status = "scheduled";
                    delete application.updateTime;
                    delete application.ownerAccessToken;
                    //Update application status
                    $scope.apiClient.applicationApplicationIdPatch({applicationId: application.applicationId}, application).then(function(res){
                        $scope.$apply();
                    });
                });
            }
        })
    };

//    My Applications Tab
    $scope.showMyApplications = function(){
        $scope.apiClient.userUserIdApplicationGet({userId: $scope.user._id}, {}).then(function(res){
            $scope.myApplications = res.data;
            $scope.$apply();
            var cIds = [];
            if($scope.myApplications.length > 0){
                for (var i=0; i<$scope.myApplications.length; i++){
                    if(cIds.indexOf($scope.myApplications[i].campaignId) === -1){
                        cIds.push($scope.myApplications[i].campaignId);
                    }
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
    };

    $scope.showApplicationStatus = function(campaign){
        $scope.selectedApply = campaign.application;
    }

    $scope.applicantConfirmPostTime = function(application){
        //TODO: set application status to confirmed
        application.status = "confirmed";
        var actionTime = new Date();
        actionTime.setDate(application.date.getDate());
        actionTime.setHours(application.time.getHours());
        actionTime.setMinutes(application.time.getMinutes());
        application.ownerActionTime = actionTime.getTime()+"";

        delete application.date;
        delete application.isCalendarOpened;
        delete application.time;
        delete application.updateTime;
        delete application.createTime;
        $scope.apiClient.applicationApplicationIdPatch({applicationId: application.applicationId}, application).then(function(res){
            $rootScope.alerts.push({type:"success", msg:"Successfully accepted application"});
            $scope.$apply();
            $scope.selectedCampaign.applications = [];
            $scope.getMyCampaigns();
        });
//        $http.get('/extendFbToken/' + $rootScope.fbToken, {}).then(function(res){
//            if(!res.data.message){
//                $rootScope.fbToken = res.data.newToken;
////                $http.post("/account/profile", $scope.user, {headers:{"Content-type": "application/json"}
////                });
//                $scope.apiClient.insightsFacebookSchedulepostPost({}, {
//                    applicationId: campaign.application.applicationId,
//                    pageId: campaign.application.pageId,
//                    actionTime: campaign.application.actionTime,
//                    accessToken: $rootScope.fbToken,
//                    message: campaign.application.message
//                }, {header: {"Content-type": "application/json"}}).then(function(res){
//                        $rootScope.alerts.push({type:"success", msg:"Post has been successfully scheduled"});
//                        campaign.application.status = "completed";
//                        delete campaign.application.updateTime;
//                        $scope.apiClient.applicationApplicationIdPatch({applicationId: campaign.application.applicationId}, campaign.application).then(function(res){
//                            $scope.$apply();
//                        });
//                        $scope.$apply();
//                    });
//            }
//        })
//        $scope.apiClient.insightsFacebookPagesGet({"accessToken": $rootScope.fbToken}, {}, {
//                headers:{"Content-type": "application/json"}
//            }
//        ).then(function(res){
//                var pageList = res.data.data;
//                for (var i=0; i<pageList.length; i++){
//                    if(pageList[i].id == campaign.application.pageId ){
//                        fbPageAccessToken = pageList[i].access_token;
//                        break;
//                    }
//                }
//                if(fbPageAccessToken != ''){
//                }
//            }).catch(function(){
//                console.log("Cannot get pages ");
//            });

        var a = {
            "actionTime": "1454058977906",
        "applicationId": "418ba6ec-9e92-4458-9f13-188a13ca268e",
        "campaignId": "952c62b1-261d-4e76-8e7d-fe91cfa85d5c",
        "message": "my pet loves it",
        "pageId": "1647789622152460",
        "reason": "i love pets",
        "status": "accepted",
        "userId": "56a3de232f0aaad58ef0fd69"}
    };
});