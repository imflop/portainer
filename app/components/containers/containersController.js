angular.module('containers', [])
  .controller('ContainersController', ['$q', '$scope', '$filter', 'Container', 'ContainerService', 'ContainerHelper', 'SystemService', 'Notifications', 'Pagination', 'EntityListService', 'ModalService', 'ResourceControlService', 'EndpointProvider',
  function ($q, $scope, $filter, Container, ContainerService, ContainerHelper, SystemService, Notifications, Pagination, EntityListService, ModalService, ResourceControlService, EndpointProvider) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('containers');
  $scope.state.displayAll = true;
  $scope.state.displayIP = false;
  $scope.sortType = 'State';
  $scope.sortReverse = false;
  $scope.state.selectedItemCount = 0;
  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };
  $scope.PublicURL = EndpointProvider.endpointPublicURL();

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('containers', $scope.state.pagination_count);
  };

  $scope.cleanAssociatedVolumes = false;

  var update = function (data) {
    $('#loadContainersSpinner').show();
    $scope.state.selectedItemCount = 0;
    Container.query(data, function (d) {
      var containers = d;
      $scope.containers = containers.map(function (container) {
        var model = new ContainerViewModel(container);
        model.Status = $filter('containerstatus')(model.Status);

        EntityListService.rememberPreviousSelection($scope.containers, model, function onSelect(model){
          $scope.selectItem(model);
        });

        if (model.IP) {
          $scope.state.displayIP = true;
        }
        if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM') {
          model.hostIP = $scope.swarm_hosts[_.split(container.Names[0], '/')[1]];
        }
        return model;
      });
      $('#loadContainersSpinner').hide();
    }, function (e) {
      $('#loadContainersSpinner').hide();
      Notifications.error('Failure', e, 'Не удалось извлечь контейнеры');
      $scope.containers = [];
    });
  };

  var batch = function (items, action, msg) {
    $('#loadContainersSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadContainersSpinner').hide();
        update({all: $scope.state.displayAll ? 1 : 0});
      }
    };
    angular.forEach(items, function (c) {
      if (c.Checked) {
        counter = counter + 1;
        if (action === Container.start) {
          action({id: c.Id}, {}, function (d) {
            Notifications.success('Container ' + msg, c.Id);
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'Не удалось запустить контейнер');
            complete();
          });
        }
        else if (action === Container.remove) {
          ContainerService.remove(c, $scope.cleanAssociatedVolumes)
          .then(function success() {
            Notifications.success('Контейнер успешно удален');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Не удалось удалить контейнер');
          })
          .finally(function final() {
            complete();
          });
        }
        else if (action === Container.pause) {
          action({id: c.Id}, function (d) {
            if (d.message) {
              Notifications.success('Контейнер уже приостановлен', c.Id);
            } else {
              Notifications.success('Контейнер ' + msg, c.Id);
            }
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'Не удается приостановить контейнер');
            complete();
          });
        }
        else {
          action({id: c.Id}, function (d) {
            Notifications.success('Container ' + msg, c.Id);
            complete();
          }, function (e) {
            Notifications.error('Failure', e, 'Произошла ошибка');
            complete();
          });

        }
      }
    });
    if (counter === 0) {
      $('#loadContainersSpinner').hide();
    }
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredContainers, function (container) {
      if (container.Checked !== allSelected) {
        container.Checked = allSelected;
        $scope.selectItem(container);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.toggleGetAll = function () {
    update({all: $scope.state.displayAll ? 1 : 0});
  };

  $scope.startAction = function () {
    batch($scope.containers, Container.start, 'Начал');
  };

  $scope.stopAction = function () {
    batch($scope.containers, Container.stop, 'Закончил');
  };

  $scope.restartAction = function () {
    batch($scope.containers, Container.restart, 'Перезагружен');
  };

  $scope.killAction = function () {
    batch($scope.containers, Container.kill, 'Убит');
  };

  $scope.pauseAction = function () {
    batch($scope.containers, Container.pause, 'Приостановлен');
  };

  $scope.unpauseAction = function () {
    batch($scope.containers, Container.unpause, 'Возобновлен');
  };

  $scope.removeAction = function () {
    batch($scope.containers, Container.remove, 'Удален');
  };

  $scope.confirmRemoveAction = function () {
    var isOneContainerRunning = false;
    angular.forEach($scope.containers, function (c) {
      if (c.Checked && c.State === 'running') {
        isOneContainerRunning = true;
        return;
      }
    });
    var title = 'Вы собираетесь удалить один или несколько контейнеров.';
    if (isOneContainerRunning) {
      title = 'Вы собираетесь удалить один или несколько запущенных контейнеров.';
    }
    ModalService.confirmContainerDeletion(
      title,
      function (result) {
        if(!result) { return; }
        $scope.cleanAssociatedVolumes = false;
        if (result[0]) {
          $scope.cleanAssociatedVolumes = true;
        }
        $scope.removeAction();
      }
    );
  };

  function retrieveSwarmHostsInfo(data) {
    var swarm_hosts = {};
    var systemStatus = data.SystemStatus;
    var node_count = parseInt(systemStatus[3][1], 10);
    var node_offset = 4;
    for (i = 0; i < node_count; i++) {
      var host = {};
      host.name = _.trim(systemStatus[node_offset][0]);
      host.ip = _.split(systemStatus[node_offset][1], ':')[0];
      swarm_hosts[host.name] = host.ip;
      node_offset += 9;
    }
    return swarm_hosts;
  }

  function initView() {
    var provider = $scope.applicationState.endpoint.mode.provider;
    $q.when(provider !== 'DOCKER_SWARM' || SystemService.info())
    .then(function success(data) {
      if (provider === 'DOCKER_SWARM') {
        $scope.swarm_hosts = retrieveSwarmHostsInfo(d);
      }
      update({all: $scope.state.displayAll ? 1 : 0});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить информацию о кластере');
    });
  }

  initView();
}]);
