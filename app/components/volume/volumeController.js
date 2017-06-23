angular.module('volume', [])
.controller('VolumeController', ['$scope', '$state', '$stateParams', 'VolumeService', 'Notifications', 'ControllerDataPipeline',
function ($scope, $state, $stateParams, VolumeService, Notifications, ControllerDataPipeline) {

  $scope.removeVolume = function removeVolume() {
    $('#loadingViewSpinner').show();
    VolumeService.remove($scope.volume)
    .then(function success(data) {
      Notifications.success('Том успешно удален', $stateParams.id);
      $state.go('volumes', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось удалить том');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    VolumeService.volume($stateParams.id)
    .then(function success(data) {
      var volume = data;
      ControllerDataPipeline.setAccessControlData('volume', volume.Id, volume.ResourceControl);
      $scope.volume = volume;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить данные о томе');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
