// @@OLD_SERVICE_CONTROLLER: this service should be rewritten to use services.
// See app/components/templates/templatesController.js as a reference.
angular.module('createService', [])
.controller('CreateServiceController', ['$q', '$scope', '$state', 'Service', 'ServiceHelper', 'SecretHelper', 'SecretService', 'VolumeService', 'NetworkService', 'ImageHelper', 'Authentication', 'ResourceControlService', 'Notifications', 'ControllerDataPipeline', 'FormValidator', 'RegistryService', 'HttpRequestHelper',
function ($q, $scope, $state, Service, ServiceHelper, SecretHelper, SecretService, VolumeService, NetworkService, ImageHelper, Authentication, ResourceControlService, Notifications, ControllerDataPipeline, FormValidator, RegistryService, HttpRequestHelper) {

  $scope.formValues = {
    Name: '',
    Image: '',
    Registry: {},
    Mode: 'replicated',
    Replicas: 1,
    Command: '',
    EntryPoint: '',
    WorkingDir: '',
    User: '',
    Env: [],
    Labels: [],
    ContainerLabels: [],
    Volumes: [],
    Network: '',
    ExtraNetworks: [],
    Ports: [],
    Parallelism: 1,
    PlacementConstraints: [],
    UpdateDelay: 0,
    FailureAction: 'pause',
    Secrets: []
  };

  $scope.state = {
    formValidationError: ''
  };

  $scope.addPortBinding = function() {
    $scope.formValues.Ports.push({ PublishedPort: '', TargetPort: '', Protocol: 'tcp', PublishMode: 'ingress' });
  };

  $scope.removePortBinding = function(index) {
    $scope.formValues.Ports.splice(index, 1);
  };

  $scope.addExtraNetwork = function() {
    $scope.formValues.ExtraNetworks.push({ Name: '' });
  };

  $scope.removeExtraNetwork = function(index) {
    $scope.formValues.ExtraNetworks.splice(index, 1);
  };

  $scope.addVolume = function() {
    $scope.formValues.Volumes.push({ Source: '', Target: '', ReadOnly: false, Type: 'volume' });
  };

  $scope.removeVolume = function(index) {
    $scope.formValues.Volumes.splice(index, 1);
  };

  $scope.addSecret = function() {
    $scope.formValues.Secrets.push({});
  };

  $scope.removeSecret = function(index) {
    $scope.formValues.Secrets.splice(index, 1);
  };

  $scope.addEnvironmentVariable = function() {
    $scope.formValues.Env.push({ name: '', value: ''});
  };

  $scope.removeEnvironmentVariable = function(index) {
    $scope.formValues.Env.splice(index, 1);
  };

  $scope.addPlacementConstraint = function() {
    $scope.formValues.PlacementConstraints.push({ key: '', operator: '==', value: '' });
  };

  $scope.removePlacementConstraint = function(index) {
    $scope.formValues.PlacementConstraints.splice(index, 1);
  };

  $scope.addPlacementPreference = function() {
    $scope.formValues.PlacementPreferences.push({ key: '', operator: '==', value: '' });
  };

  $scope.removePlacementPreference = function(index) {
    $scope.formValues.PlacementPreferences.splice(index, 1);
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ name: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  $scope.addContainerLabel = function() {
    $scope.formValues.ContainerLabels.push({ name: '', value: ''});
  };

  $scope.removeContainerLabel = function(index) {
    $scope.formValues.ContainerLabels.splice(index, 1);
  };

  function prepareImageConfig(config, input) {
    var imageConfig = ImageHelper.createImageConfigForContainer(input.Image, input.Registry.URL);
    config.TaskTemplate.ContainerSpec.Image = imageConfig.fromImage + ':' + imageConfig.tag;
  }

  function preparePortsConfig(config, input) {
    var ports = [];
    input.Ports.forEach(function (binding) {
      var port = {
        Protocol: binding.Protocol,
        PublishMode: binding.PublishMode
      };
      if (binding.TargetPort) {
        port.TargetPort = +binding.TargetPort;
        if (binding.PublishedPort) {
          port.PublishedPort = +binding.PublishedPort;
        }
        ports.push(port);
      }
    });
    config.EndpointSpec.Ports = ports;
  }

  function prepareSchedulingConfig(config, input) {
    if (input.Mode === 'replicated') {
      config.Mode.Replicated = {
        Replicas: input.Replicas
      };
    } else {
      config.Mode.Global = {};
    }
  }

  function commandToArray(cmd) {
    var tokens = [].concat.apply([], cmd.split('\'').map(function(v,i) {
       return i%2 ? v : v.split(' ');
    })).filter(Boolean);
    return tokens;
  }

  function prepareCommandConfig(config, input) {
    if (input.EntryPoint) {
      config.TaskTemplate.ContainerSpec.Command = commandToArray(input.EntryPoint);
    }
    if (input.Command) {
      config.TaskTemplate.ContainerSpec.Args = commandToArray(input.Command);
    }
    if (input.User) {
      config.TaskTemplate.ContainerSpec.User = input.User;
    }
    if (input.WorkingDir) {
      config.TaskTemplate.ContainerSpec.Dir = input.WorkingDir;
    }
  }

  function prepareEnvConfig(config, input) {
    var env = [];
    input.Env.forEach(function (v) {
      if (v.name) {
        env.push(v.name + '=' + v.value);
      }
    });
    config.TaskTemplate.ContainerSpec.Env = env;
  }

  function prepareLabelsConfig(config, input) {
    var labels = {};
    input.Labels.forEach(function (label) {
      if (label.name && label.value) {
          labels[label.name] = label.value;
      }
    });
    config.Labels = labels;

    var containerLabels = {};
    input.ContainerLabels.forEach(function (label) {
      if (label.name && label.value) {
          containerLabels[label.name] = label.value;
      }
    });
    config.TaskTemplate.ContainerSpec.Labels = containerLabels;
  }

  function prepareVolumes(config, input) {
    input.Volumes.forEach(function (volume) {
      if (volume.Source && volume.Target) {
        config.TaskTemplate.ContainerSpec.Mounts.push(volume);
      }
    });
  }

  function prepareNetworks(config, input) {
    var networks = [];
    if (input.Network) {
      networks.push({ Target: input.Network });
    }
    input.ExtraNetworks.forEach(function (network) {
      networks.push({ Target: network.Name });
    });
    config.Networks = _.uniqWith(networks, _.isEqual);
  }

  function prepareUpdateConfig(config, input) {
    config.UpdateConfig = {
      Parallelism: input.Parallelism || 0,
      Delay: input.UpdateDelay || 0,
      FailureAction: input.FailureAction
    };
  }
  function preparePlacementConfig(config, input) {
    config.TaskTemplate.Placement.Constraints = ServiceHelper.translateKeyValueToPlacementConstraints(input.PlacementConstraints);
  }

  function prepareSecretConfig(config, input) {
    if (input.Secrets) {
      var secrets = [];
      angular.forEach(input.Secrets, function(secret) {
        if (secret.model) {
          secrets.push(SecretHelper.secretConfig(secret.model));
        }
      });
      config.TaskTemplate.ContainerSpec.Secrets = secrets;
    }
  }

  function prepareConfiguration() {
    var input = $scope.formValues;
    var config = {
      Name: input.Name,
      TaskTemplate: {
        ContainerSpec: {
          Mounts: []
        },
        Placement: {}
      },
      Mode: {},
      EndpointSpec: {}
    };
    prepareSchedulingConfig(config, input);
    prepareImageConfig(config, input);
    preparePortsConfig(config, input);
    prepareCommandConfig(config, input);
    prepareEnvConfig(config, input);
    prepareLabelsConfig(config, input);
    prepareVolumes(config, input);
    prepareNetworks(config, input);
    prepareUpdateConfig(config, input);
    prepareSecretConfig(config, input);
    preparePlacementConfig(config, input);
    return config;
  }

  function createNewService(config, accessControlData) {

    var registry = $scope.formValues.Registry;
    var authenticationDetails = registry.Authentication ? RegistryService.encodedCredentials(registry) : '';
    HttpRequestHelper.setRegistryAuthenticationHeader(authenticationDetails);
    Service.create(config).$promise
    .then(function success(data) {
      var serviceIdentifier = data.ID;
      var userId = Authentication.getUserDetails().ID;
      return ResourceControlService.applyResourceControl('service', serviceIdentifier, userId, accessControlData, []);
    })
    .then(function success() {
      Notifications.success('Сервис успешно создан');
      $state.go('services', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Невозможно создать сервис');
    })
    .finally(function final() {
      $('#createServiceSpinner').hide();
    });
  }

  function validateForm(accessControlData, isAdmin) {
    $scope.state.formValidationError = '';
    var error = '';
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  $scope.create = function createService() {
    $('#createServiceSpinner').show();

    var accessControlData = ControllerDataPipeline.getAccessControlFormData();
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true : false;

    if (!validateForm(accessControlData, isAdmin)) {
      $('#createServiceSpinner').hide();
      return;
    }

    var config = prepareConfiguration();
    createNewService(config, accessControlData);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      volumes: VolumeService.volumes(),
      networks: NetworkService.retrieveSwarmNetworks(),
      secrets: SecretService.secrets()
    })
    .then(function success(data) {
      $scope.availableVolumes = data.volumes;
      $scope.availableNetworks = data.networks;
      $scope.availableSecrets = data.secrets;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось инициализировать представление');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
