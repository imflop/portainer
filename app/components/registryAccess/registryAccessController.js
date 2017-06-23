angular.module('registryAccess', [])
.controller('RegistryAccessController', ['$scope', '$stateParams', 'RegistryService', 'Notifications',
function ($scope, $stateParams, RegistryService, Notifications) {

  $scope.updateAccess = function(authorizedUsers, authorizedTeams) {
    return RegistryService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    RegistryService.registry($stateParams.id)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить сведения о реестре');
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
