app.controller('campaignCtrl', function ($scope, $uibModal) {
	$scope.campaigns = [
	{
		'title': 'Coca-Cola Christmas Campaign',
		'followers': 5000,
		'user': {
			'username': 'cocacola', 
			'photoUrl': "http://vignette4.wikia.nocookie.net/logopedia/images/5/59/Coca-Cola_logo_2007.jpg"
		},
		'ageRange': '16-50',
		'gender': "Unspecified",
		'categories': ["Food", "Product"]
	},{
		'title': 'Design Studio Ad',
		'followers': 1000,
		'user': {
			'username': 'graphic_designer', 
			'photoUrl': "http://d6d-studio.com/wp-content/uploads/2015/11/D6D-creative-studio-Logo-black.png"
		},
		'ageRange': "Unspecified",
		'gender': "female"
	},{
		'title': 'Youtuber FB post',
		'followers': 2000,
		'user': {
			'username': 'J_comedy', 
			'photoUrl': "https://lh5.googleusercontent.com/-ZadaXoUTBfs/AAAAAAAAAAI/AAAAAAAAAGA/19US52OmBqc/photo.jpg"
		},
		'ageRange': '12-30',
		'gender': "Unspecified",
		'desc': "Post a Facebook feed for my channel."
	}
	];

	$scope.openCreateModal = function(){
		var uibModalInstance = $uibModal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'createCampaignModal.html',
			controller: function($uibModalInstance ,$scope){
				$scope.close = function () {
					$uibModalInstance.close();
				};
				$scope.ok = function(){
					$uibModalInstance.close();
				}
			}
		});

		uibModalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			$log.info('Modal dismissed at: ' + new Date());
		});

	};
});

