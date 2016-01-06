app.controller('campaignCtrl', function ($scope, $uibModal, $rootScope) {
    $scope.campaigns = [];
    $scope.test = "abc";
    $scope.apiClient = apigClientFactory.newClient({
                                             "apiKey": 'G84MftERYj7VP0ACf3uQh3w9ewFbgdi06C1GtA1B'
                                            });
    $scope.showSearchCriteria = false;

    $scope.search = {
        ageRange: "0-100",
        numberOfFollowers: 10
    };
    $scope.defaultSearch = {
                              "ageRange": "0-100",
                              "count": "20",
                              "numberOfFollowers": 10
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



	$scope.openCreateModal = function(){
		var uibModalInstance = $uibModal.open({
			animation: $scope.animationsEnabled,
			templateUrl: '/app/createCampaignModal.html',
			controller: function($uibModalInstance ,$scope, $rootScope){
			    $scope.campaign = {
			        minAge:"",
			        maxAge:"",
			        topic:"",
			        details: "",
			        numberOfFollowers: "",
			        thumbnail: ""
			    };
				$scope.close = function () {
					$uibModalInstance.close();
				};
				$scope.apiClient = apigClientFactory.newClient({
                                                             "apiKey": 'G84MftERYj7VP0ACf3uQh3w9ewFbgdi06C1GtA1B'
                                                            });
				$scope.ok = function(){
                    var campaign = $scope.campaign;
                    campaign.campaignId = generateUUID();
                    campaign.userId = "user1";
                    if(campaign.thumbnail==""){
                        campaign.thumbnail = "http://www.localmediamethods.com/wp-content/uploads/2013/03/How-Nielsen%E2%80%99s-Definition-of-a-TV-Household-Impacts-Your-Local-Media-Campaign.jpeg";
                    }
                    campaign.numberOfViews = 0;
                    campaign.status = "pending";
                    $scope.apiClient.campaignPost({}, campaign, {    headers:{"Content-type": "application/json"}}).then(
                        function(data){
                            $rootScope.getCampaigns();
                        }).catch(function(e){
                            console.log(e);
                        });
                        $uibModalInstance.close();
				}
			}
		});
	};
});

