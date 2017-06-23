angular.module('registry', [])
.controller('RegistryController', ['$scope', '$state', '$stateParams', '$filter', 'RegistryService', 'Notifications',
function ($scope, $state, $stateParams, $filter, RegistryService, Notifications) {

  $scope.updateRegistry = function() {
    $('#updateRegistrySpinner').show();
    var registry = $scope.registry;
    RegistryService.updateRegistry(registry)
    .then(function success(data) {
      Notifications.success('Реестр успешно обновлен');
      $state.go('registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось обновить реестр');
    })
    .finally(function final() {
      $('#updateRegistrySpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    var registryID = $stateParams.id;
    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить сведения о реестре');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
