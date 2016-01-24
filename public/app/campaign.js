app.controller('campaignCtrl', function ($scope, $uibModal, $rootScope) {
    $scope.campaigns = [];
    $scope.test = "abc";

    $scope.showSearchCriteria = false;

    $scope.search = {
        ageRange: "0-100",
        numberOfFollowers: 10
    };
    $scope.defaultSearch = {
                              "ageRange": "0-100",
                              "count": "50",
                              "numberOfFollowers": 10,
                                "campaignIds": "",
                               "startKey": "",
                               "tags": ""
                           };
     $scope.toggleSearch = function(){
            $scope.showSearchCriteria = !$scope.showSearchCriteria;
        };

    $rootScope.getCampaigns = $scope.getCampaigns = function(){
    $scope.apiClient.campaignGet(angular.extend($scope.defaultSearch, $scope.search), {}, {
        headers:{"Content-type": "application/json"}
    }
    ).then(function(campaigns){
    	    $scope.campaigns = campaigns.data;
        $scope.$apply   ();
    	}).catch(function(){
    	    console.log("error");
    	});
    };
    $scope.getCampaigns();

});

app.controller('createCampaignCtrl', function ($scope, $uibModal, $rootScope, $location) {
    $scope.ok = function(){
        var campaign = $scope.campaign;
        campaign.campaignId = generateUUID();
        campaign.userId = $rootScope.user._id;
        if(campaign.thumbnail==""){
            campaign.thumbnail = "http://www.localmediamethods.com/wp-content/uploads/2013/03/How-Nielsen%E2%80%99s-Definition-of-a-TV-Household-Impacts-Your-Local-Media-Campaign.jpeg";
        }
        campaign.numberOfViews = 0;
        campaign.status = "pending";
        $scope.apiClient.campaignPost({}, campaign, {    headers:{"Content-type": "application/json"}}).then(
            function(data){
                $location.path('/campaign');
                $scope.$apply();
            }).catch(function(e){
                $rootScope.alerts.push({type:"danger", msg:"Failed to create campaign."});
                $scope.$apply();
            });
    }
});
