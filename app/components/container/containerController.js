angular.module('container', [])
.controller('ContainerController', ['$scope', '$state','$stateParams', '$filter', 'Container', 'ContainerCommit', 'ContainerService', 'ImageHelper', 'Network', 'Notifications', 'Pagination', 'ModalService', 'ControllerDataPipeline',
function ($scope, $state, $stateParams, $filter, Container, ContainerCommit, ContainerService, ImageHelper, Network, Notifications, Pagination, ModalService, ControllerDataPipeline) {
  $scope.activityTime = 0;
  $scope.portBindings = [];
  $scope.config = {
    Image: '',
    Registry: ''
  };
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('container_networks');

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('container_networks', $scope.state.pagination_count);
  };

  var update = function () {
    $('#loadingViewSpinner').show();
    Container.get({id: $stateParams.id}, function (d) {
      var container = new ContainerDetailsViewModel(d);
      $scope.container = container;
      ControllerDataPipeline.setAccessControlData('container', $stateParams.id, container.ResourceControl);
      $scope.container.edit = false;
      $scope.container.newContainerName = $filter('trimcontainername')(container.Name);

      if (container.State.Running) {
        $scope.activityTime = moment.duration(moment(container.State.StartedAt).utc().diff(moment().utc())).humanize();
      } else if (container.State.Status === 'created') {
        $scope.activityTime = moment.duration(moment(container.Created).utc().diff(moment().utc())).humanize();
      } else {
        $scope.activityTime = moment.duration(moment().utc().diff(moment(container.State.FinishedAt).utc())).humanize();
      }

      $scope.portBindings = [];
      if (container.NetworkSettings.Ports) {
        angular.forEach(Object.keys(container.NetworkSettings.Ports), function(portMapping) {
          if (container.NetworkSettings.Ports[portMapping]) {
            var mapping = {};
            mapping.container = portMapping;
            mapping.host = container.NetworkSettings.Ports[portMapping][0].HostIp + ':' + container.NetworkSettings.Ports[portMapping][0].HostPort;
            $scope.portBindings.push(mapping);
          }
        });
      }
      $('#loadingViewSpinner').hide();
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Не удалось получить информацию об агенте');
    });
  };

  $scope.start = function () {
    $('#loadingViewSpinner').show();
    Container.start({id: $scope.container.Id}, {}, function (d) {
      update();
      Notifications.success('Агент запущен', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Не удалось запустить агента');
    });
  };

  $scope.stop = function () {
    $('#loadingViewSpinner').show();
    Container.stop({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Агент остановлен', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Не удалось остановить агент');
    });
  };

  $scope.kill = function () {
    $('#loadingViewSpinner').show();
    Container.kill({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Агент убит', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Не удалось убить агента');
    });
  };

  $scope.commit = function () {
    $('#createImageSpinner').show();
    var image = $scope.config.Image;
    var registry = $scope.config.Registry;
    var imageConfig = ImageHelper.createImageConfigForCommit(image, registry);
    ContainerCommit.commit({id: $stateParams.id, tag: imageConfig.tag, repo: imageConfig.repo}, function (d) {
      $('#createImageSpinner').hide();
      update();
      Notifications.success('Агент зафиксирован', $stateParams.id);
    }, function (e) {
      $('#createImageSpinner').hide();
      update();
      Notifications.error('Failure', e, 'Не удалось фиксировать агент');
    });
  };

  $scope.pause = function () {
    $('#loadingViewSpinner').show();
    Container.pause({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Агент приостановлен', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Не удается приостановить агент');
    });
  };

  $scope.unpause = function () {
    $('#loadingViewSpinner').show();
    Container.unpause({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Агент сняли с паузы', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Не удалось возобновить агент');
    });
  };

  $scope.confirmRemove = function () {
    var title = 'Вы собираетесь удалить агента.';
    if ($scope.container.State.Running) {
      title = 'Вы собираетесь удалить запущенный агент.';
    }
    ModalService.confirmContainerDeletion(
      title,
      function (result) {
        if(!result) { return; }
        var cleanAssociatedVolumes = false;
        if (result[0]) {
          cleanAssociatedVolumes = true;
        }
        $scope.remove(cleanAssociatedVolumes);
      }
    );
  };

  $scope.remove = function(cleanAssociatedVolumes) {
    $('#loadingViewSpinner').show();
    ContainerService.remove($scope.container, cleanAssociatedVolumes)
    .then(function success() {
      Notifications.success('Агент успешно удален');
      $state.go('containers', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось удалить агент');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.restart = function () {
    $('#loadingViewSpinner').show();
    Container.restart({id: $stateParams.id}, function (d) {
      update();
      Notifications.success('Агент перезагружен', $stateParams.id);
    }, function (e) {
      update();
      Notifications.error('Failure', e, 'Не удалось перезагрузить агент');
    });
  };

  $scope.renameContainer = function () {
    var container = $scope.container;
    Container.rename({id: $stateParams.id, 'name': container.newContainerName}, function (d) {
      if (d.message) {
        container.newContainerName = container.Name;
        Notifications.error('Не удалось переименовать агент', {}, d.message);
      } else {
        container.Name = container.newContainerName;
        Notifications.success('Агент успешно переименован', container.Name);
      }
    }, function (e) {
      Notifications.error('Failure', e, 'Невозможно переименовать агент');
    });
    $scope.container.edit = false;
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(container, networkId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: networkId}, { Container: $stateParams.id, Force: false }, function (d) {
      if (container.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error('Error', d, 'Не удается отключить агент от сети');
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success('Агент покинул сеть', $stateParams.id);
        $state.go('container', {id: $stateParams.id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Не удается отключить агент от сети');
    });
  };

  update();
}]);
