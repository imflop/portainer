angular.module('network', [])
.controller('NetworkController', ['$scope', '$state', '$stateParams', '$filter', 'Network', 'Container', 'ContainerHelper', 'Notifications',
function ($scope, $state, $stateParams, $filter, Network, Container, ContainerHelper, Notifications) {

  $scope.removeNetwork = function removeNetwork(networkId) {
    $('#loadingViewSpinner').show();
    Network.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error('Error', d, 'Не удалось удалить сеть');
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success('Сеть удалена', $stateParams.id);
        $state.go('networks', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Не удалось удалить сеть');
    });
  };

  $scope.containerLeaveNetwork = function containerLeaveNetwork(network, containerId) {
    $('#loadingViewSpinner').show();
    Network.disconnect({id: $stateParams.id}, { Container: containerId, Force: false }, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.error('Error', d, 'Невозможно отключить агент от сети');
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.success('Агент покинул сеть', $stateParams.id);
        $state.go('network', {id: network.Id}, {reload: true});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', e, 'Невозможно отключить агент от сети');
    });
  };

  function filterContainersInNetwork(network, containers) {
    var containersInNetwork = [];
    containers.forEach(function(container) {
      var containerInNetwork = network.Containers[container.Id];
      containerInNetwork.Id = container.Id;
      // Name is not available in Docker 1.9
      if (!containerInNetwork.Name) {
        containerInNetwork.Name = $filter('trimcontainername')(container.Names[0]);
      }
      containersInNetwork.push(containerInNetwork);
    });
    $scope.containersInNetwork = containersInNetwork;
  }

  function getContainersInNetwork(network) {
    if (network.Containers) {
      if ($scope.applicationState.endpoint.apiVersion < 1.24) {
        Container.query({}, function success(data) {
          var containersInNetwork = data.filter(function filter(container) {
            if (container.HostConfig.NetworkMode === network.Name) {
              return container;
            }
          });
          filterContainersInNetwork(network, containersInNetwork);
          $('#loadingViewSpinner').hide();
        }, function error(err) {
          $('#loadingViewSpinner').hide();
          Notifications.error('Failure', err, 'Невозможно получить агенты в сети');
        });
      } else {
        Container.query({
          filters: {network: [$stateParams.id]}
        }, function success(data) {
          filterContainersInNetwork(network, data);
          $('#loadingViewSpinner').hide();
        }, function error(err) {
          $('#loadingViewSpinner').hide();
          Notifications.error('Failure', err, 'Невозможно получить агенты в сети');
        });
      }
    }
  }

  function initView() {
    $('#loadingViewSpinner').show();
    Network.get({id: $stateParams.id}, function success(data) {
      $scope.network = data;
      getContainersInNetwork(data);
    }, function error(err) {
      $('#loadingViewSpinner').hide();
      Notifications.error('Failure', err, 'Не удалось получить информацию о сети');
    });
  }

  initView();
}]);
