angular.module('endpointAccess', [])
.controller('EndpointAccessController', ['$scope', '$stateParams', 'EndpointService', 'Notifications',
function ($scope, $stateParams, EndpointService, Notifications) {

  $scope.updateAccess = function(authorizedUsers, authorizedTeams) {
    return EndpointService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    EndpointService.endpoint($stateParams.id)
    .then(function success(data) {
      $scope.endpoint = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить сведения об узле');
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
