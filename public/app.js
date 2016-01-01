'use strict'
var app = angular.module('app', ['ngRoute', 'ui.bootstrap']);

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/campaign', {
        templateUrl: 'campaign.html',
        controller: 'campaignCtrl'
      }).
      when('/appStatus', {
        templateUrl: '/appStatus.html',
        controller: 'appStatusCtrl'
      }).     
      when('/performance', {
        templateUrl: '/performance.html',
        controller: 'performanceCtrl'
      }).
      otherwise({
        redirectTo: '/campaign'
      });
  }]);
app.controller('rootCtrl', function ($scope) {
  $scope.phones = [
    {'name': 'Nexus S',
     'snippet': 'Fast just got faster with Nexus S.'},
    {'name': 'Motorola XOOM™ with Wi-Fi',
     'snippet': 'The Next, Next Generation tablet.'},
    {'name': 'MOTOROLA XOOM™',
     'snippet': 'The Next, Next Generation tablet.'}
  ];
});