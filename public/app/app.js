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