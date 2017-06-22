angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'Notifications', 'Pagination',
function ($scope, $state, Network, Notifications, Pagination) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('networks');
  $scope.state.selectedItemCount = 0;
  $scope.state.advancedSettings = false;
  $scope.sortType = 'Name';
  $scope.sortReverse = false;
  $scope.config = {
    Name: ''
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('networks', $scope.state.pagination_count);
  };

  function prepareNetworkConfiguration() {
    var config = angular.copy($scope.config);
    if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM' || $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
      config.Driver = 'overlay';
      // Force IPAM Driver to 'default', should not be required.
      // See: https://github.com/docker/docker/issues/25735
      config.IPAM = {
        Driver: 'default'
      };
    }
    return config;
  }

  $scope.createNetwork = function() {
    $('#createNetworkSpinner').show();
    var config = prepareNetworkConfiguration();
    Network.create(config, function (d) {
      if (d.message) {
        $('#createNetworkSpinner').hide();
        Notifications.error('Не удалось создать сеть', {}, d.message);
      } else {
        Notifications.success('Сеть создана', d.Id);
        $('#createNetworkSpinner').hide();
        $state.reload();
      }
    }, function (e) {
      $('#createNetworkSpinner').hide();
      Notifications.error('Failure', e, 'Не удалось создать сеть');
    });
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItems = function(allSelected) {
    angular.forEach($scope.state.filteredNetworks, function (network) {
      if (network.Checked !== allSelected) {
          network.Checked = allSelected;
          $scope.selectItem(network);
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

  $scope.removeAction = function () {
    $('#loadNetworksSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadNetworksSpinner').hide();
      }
    };
    angular.forEach($scope.networks, function (network) {
      if (network.Checked) {
        counter = counter + 1;
        Network.remove({id: network.Id}, function (d) {
          if (d.message) {
            Notifications.error('Error', d, 'Не удалось удалить сеть');
          } else {
            Notifications.success('Сеть удалена', network.Id);
            var index = $scope.networks.indexOf(network);
            $scope.networks.splice(index, 1);
          }
          complete();
        }, function (e) {
          Notifications.error('Failure', e, 'Не удалось удалить сеть');
          complete();
        });
      }
    });
  };

  function initView() {
    $('#loadNetworksSpinner').show();
    Network.query({}, function (d) {
      $scope.networks = d;
      $('#loadNetworksSpinner').hide();
    }, function (e) {
      $('#loadNetworksSpinner').hide();
      Notifications.error('Failure', e, 'Не удается найти сети');
      $scope.networks = [];
    });
  }

  initView();
}]);
