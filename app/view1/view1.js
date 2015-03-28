'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'eventCtrl'
  });
}])

.controller('eventCtrl',["$scope","$http",function($scope,$http) {
    $scope.eventData = [
        {"title":"Event Title1","description":"Event Descriptssssssss","eventDate": "1234","type":"To be chosen"},
        {"title":"Event Title2","description":"Event Description2","eventDate": "1234","type":"To be chosen"},
        {"title":"Event Title3","description":"Event Description3","eventDate": "1234","type":"To be chosen"},
        {"title":"Event Title4","description":"Event Description4","eventDate": "12111134","type":"To be chosen"},
        {"title":"Event Title5","description":"Event Description5","eventDate": "1234","type":"To be chosen"},
        {"title":"Event Title6","description":"Event Description6","eventDate": "1234","type":"To be chosen"}
    ];

    $scope.eventType = [
        "Children",
        "Animal",
        "Environment",
        "Elderly",
        "Physically",
        "Disabled",
        "Financial",
        "Difficulty",
        "Hidden",
        "Disabled (Blind and/or Deaf)",
        "Illness (Cancer Patients)",
        "Mentally Disabled Ex-Offenders"];

    $scope.createEvent = function(newEvent){
        alert(newEvent.myEventTitle + " " + newEvent.myEventDescription + " " + newEvent.myEventDate + " " + newEvent.myEventType);
    };


}]);