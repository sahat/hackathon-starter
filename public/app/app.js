'use strict'
var app = angular.module('app', ['ngRoute', 'ui.bootstrap']);

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};
app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/campaign', {
                templateUrl: '/app/campaign.html',
                controller: 'campaignCtrl'
            }).
            when('/appStatus', {
                templateUrl: '/app/appStatus.html',
                controller: 'appStatusCtrl'
            }).
            when('/performance', {
                templateUrl: '/app/performance.html',
                controller: 'performanceCtrl'
            }).
            when('/login', {
                templateUrl: '/app/login.html',
                controller: 'loginCtrl'
            }).
            when('/profile', {
                templateUrl: '/app/account.html',
                controller: 'profileCtrl'
            }).
            when('/createCampaign', {
                templateUrl: '/app/createCampaign.html',
                controller: 'createCampaignCtrl'
            }).
            when('/campaignDetails', {
                templateUrl: '/app/campaignDetails.html',
                controller: 'campaignDetailsCtrl'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);
app.controller('rootCtrl', function ($scope, $rootScope, $http, $location, $uibModal) {
    $scope.alertError = function(msg){
        $rootScope.alerts.push({type: "danger", msg: msg});
    }

    $rootScope.alerts = [];
    $scope.closeAlert = function(index) {
        $rootScope.alerts.splice(index, 1);
    };
    $scope.openSignUpModal = function(){
        var uibModalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: '/app/signup.html',
            controller: function($uibModalInstance ,$scope, $rootScope){
                $scope.account = {
                };
                $scope.close = function () {
                    $uibModalInstance.close();
                };
                $scope.alerts = [];
                $scope.submit = function(){
                    var ac = $scope.account;
                    if(ac.password === ac.confirmPassword){
                        $http.post('/signup', ac, {header: {"Content-type": "application/json"}}).then(function(data){
                            //success
                            $rootScope.user = data.data;
                            $uibModalInstance.close();
                            $location.path('/profile');
                        }, function(response){
                            angular.forEach(response.data.errors, function(error){
                                $scope.alerts.push({type: "danger", msg:error.msg});
                            });
                            //failed
                        });
                    } else {
                        //    				    show error
                        $scope.alerts.push({type:"danger", msg:"Passwords don't match."});
                    }

                }
            }
        });
    };

    $http.get('/login').then(function(res){
        if(res.data._id){
            $rootScope.user = res.data;

        } else {
            $location.path('/login');
            $scope.$on('$routeChangeStart', function(){
                if(!$rootScope.user){
                    $location.path('/login');
                }
            });
        }
    }, function(){});

    $scope.apiClient = apigClientFactory.newClient({
        "apiKey": 'G84MftERYj7VP0ACf3uQh3w9ewFbgdi06C1GtA1B'
    });

});