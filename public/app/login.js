app.controller('loginCtrl', function ($scope, $rootScope, $http, $location) {
   if($rootScope.user){
               $location.path('/campaign');
   }

  $scope.login = function(){
        $http({
          method: 'POST',
          url: '/login',
          data: {
              email: $scope.email,
              password: $scope.password,
              csrf: $scope.csrf
          }
        }).then(function (response) {
            $rootScope.user = response.data;
            $location.path('/campaign');
          }, function(response) {

          });
          }
});