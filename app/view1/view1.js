'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'eventCtrl'
  });
}])

.controller('eventCtrl',["$scope","$http","$filter","$q","$location",function($scope,$http,$filter,$q,$location) {

        $scope.isVisitor = true;

        $scope.myEventsSelClass="";
        $scope.myParticipationSelClass="";

        $scope.loadMyEvents = function() {
            var promiseArr = [];
            promiseArr.push($http({
                method:"GET",
                url:"/api/event",
                headers:{"Accept": "application/json"}
            }));

            $q.all(promiseArr).then(function(results){
                console.log(results);
                if (results) {
                    $scope.myEventsSelClass="btn-primary";
                    $scope.myParticipationSelClass="";
                    $scope.eventData.length = 0;
                    for (var x in results) {
                        if (Object.prototype.hasOwnProperty.call(results,x)) {
                            for (var i = 0; i < results[x].data.length; i++) {
                                $scope.eventData.push(results[x].data[i]);
                            }
                        }
                    }
                }
            },function(error){
                $scope.myEventsSelClass="";
                $scope.myParticipationSelClass="";
            });
        };

        $scope.loadMyParticipation = function() {
            var promiseArr = [];
            promiseArr.push($http({
                method:"GET",
                url:"/api/rsvp",
                headers:{"Accept": "application/json"}
            }));

            $q.all(promiseArr).then(function(results){
                console.log(results);
                if (results) {
                    $scope.myParticipationSelClass="btn-primary";
                    $scope.myEventsSelClass="";
                    $scope.eventData.length = 0;
                    for (var x in results) {
                        if (Object.prototype.hasOwnProperty.call(results,x)) {
                            for (var i = 0; i < results[x].data.length; i++) {
                                $scope.eventData.push(results[x].data[i]);
                            }
                        }
                    }
                }
            },function(error){
                $scope.myParticipationSelClass="";
                $scope.myEventsSelClass="";
            });
        };

        $scope.isUserLoggedIn = function() {
            var promiseArr = [];
            promiseArr.push($http({
                method:"GET",
                url:"/isUserloggedIn",
                headers:{"Accept": "application/json"}
            }));
            $q.all(promiseArr).then(function(results){
                console.log(results);
                for (var x in results) {
                    if (Object.prototype.hasOwnProperty.call(results,x)) {
                        if (results[x].data == 0) {
                            $scope.isVisitor = true;
                        } else {
                            $scope.isVisitor = false;
                        }
                    }
                }
            },function(error){
            });
        };
        $scope.isUserLoggedIn();


        $scope.logoutUser = function() {
            var promiseArr = [];
            promiseArr.push($http({
                method:"GET",
                url:"/logout",
                headers:{"Accept": "application/json"}
            }));
            $q.all(promiseArr).then(function(results){
                $location.path("/");
            },function(error){
            });
        };

        $scope.fetchDataOnLoad =  function() {
            var promiseArr = [];
            promiseArr.push($http({
                method:"GET",
                url:"/api/events",
                headers:{"Accept": "application/json"}
            }));

            $q.all(promiseArr).then(function(results){
                console.log(results);
                if (results) {
                    $scope.myParticipationSelClass="";
                    $scope.myEventsSelClass=""
                    for (var x in results) {
                        if (Object.prototype.hasOwnProperty.call(results,x)) {
                            for (var i = 0; i < results[x].data.length; i++) {
                                $scope.eventData.push(results[x].data[i]);
                            }
                        }
                    }
                }
            },function(error){
        });
    };

    $scope.fetchDataOnLoad();

    $scope.eventData = [
        //{"title":"Event Title1","description":"Event Descriptssssssss","eventDate": "1234","type":"To be chosen"},
        //{"title":"Event Title2","description":"Event Description2","eventDate": "1234","type":"To be chosen"},
        //{"title":"Event Title3","description":"Event Description3","eventDate": "1234","type":"To be chosen"},
        //{"title":"Event Title4","description":"Event Description4","eventDate": "12111134","type":"To be chosen"},
        //{"title":"Event Title5","description":"Event Description5","eventDate": "1234","type":"To be chosen"},
        //{"title":"Event Title6","description":"Event Description6","eventDate": "1234","type":"To be chosen"}
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
        var eventDataX={};
        var convertedDate = new Date($filter('date')(newEvent.myEventDate)).getTime();
        eventDataX.eventDate = convertedDate;
        eventDataX.type = newEvent.myEventType;
        eventDataX.description= newEvent.myEventDescription;
        eventDataX.title = newEvent.myEventTitle;
        var promiseArr = [];
        promiseArr.push($http({
            method:"POST",
            url:"/api/event",
            data:eventDataX,
            headers:{"Accept": "application/json"}
        }));

        $q.all(promiseArr).then(function(results){
            console.log(results);
            for (var x in results) {
                if (Object.prototype.hasOwnProperty.call(results,x)) {
                    $scope.eventData.push(results[x].data);
                }
            }
            angular.element('#myEventCreation').modal('hide');
        },function(error){
        });
    };

    $scope.enableDelete = function() {
        if ($scope.myParticipationSelClass || $scope.myEventsSelClass) {
            return true;
        } else {
            return false;
        }
    }

    $scope.deleteSelectedEvent = function(item) {
        var promiseArr = [];
        if ($scope.myParticipationSelClass) {
            promiseArr.push($http({
                method:"DELETE",
                url:"/api/rsvp/" + item._id,
                data:item,
                headers:{"Accept": "application/json"}
            }));

            $q.all(promiseArr).then(function(results){
                $scope.loadMyParticipation();
            },function(error){
            });
        } else if ($scope.myEventsSelClass) {
            promiseArr.push($http({
                method:"DELETE",
                url:"/api/event/" + item._id,
                data:item,
                headers:{"Accept": "application/json"}
            }));

            $q.all(promiseArr).then(function(results){
                $scope.loadMyEvents();
            },function(error){
            });
        }
    };

    $scope.joinSelectedEvent = function(item) {
        var promiseArr = [];
        promiseArr.push($http({
            method:"POST",
            url:"/api/rsvp/" + item._id,
            data:item,
            headers:{"Accept": "application/json"}
        }));

        $q.all(promiseArr).then(function(results){
            $scope.eventData.length = 0;
            $scope.fetchDataOnLoad();
        },function(error){
        });
    };

}]);