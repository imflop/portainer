angular.module('settings', [])
.controller('SettingsController', ['$scope', '$state', 'Notifications', 'SettingsService', 'StateManager', 'DEFAULT_TEMPLATES_URL',
function ($scope, $state, Notifications, SettingsService, StateManager, DEFAULT_TEMPLATES_URL) {

  $scope.formValues = {
    customLogo: false,
    customTemplates: false,
    externalContributions: false,
    labelName: '',
    labelValue: ''
  };

  $scope.removeFilteredContainerLabel = function(index) {
    var settings = $scope.settings;
    settings.BlackListedLabels.splice(index, 1);

    updateSettings(settings, false);
  };

  $scope.addFilteredContainerLabel = function() {
    var settings = $scope.settings;
    var label = {
      name: $scope.formValues.labelName,
      value: $scope.formValues.labelValue
    };
    settings.BlackListedLabels.push(label);

    updateSettings(settings, true);
  };

  $scope.saveApplicationSettings = function() {
    var settings = $scope.settings;

    if (!$scope.formValues.customLogo) {
      settings.LogoURL = '';
    }

    if (!$scope.formValues.customTemplates) {
      settings.TemplatesURL = DEFAULT_TEMPLATES_URL;
    }
    settings.DisplayExternalContributors = !$scope.formValues.externalContributions;

    updateSettings(settings, false);
  };

  function resetFormValues() {
    $scope.formValues.labelName = '';
    $scope.formValues.labelValue = '';
  }

  function updateSettings(settings, resetForm) {
    $('#loadingViewSpinner').show();

    SettingsService.update(settings)
    .then(function success(data) {
      Notifications.success('Настройки обновлены');
      StateManager.updateLogo(settings.LogoURL);
      StateManager.updateExternalContributions(settings.DisplayExternalContributors);
      if (resetForm) {
        resetFormValues();
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось обновить настройки');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();
    SettingsService.settings()
    .then(function success(data) {
      var settings = data;
      $scope.settings = settings;
      if (settings.LogoURL !== '') {
        $scope.formValues.customLogo = true;
      }
      if (settings.TemplatesURL !== DEFAULT_TEMPLATES_URL) {
        $scope.formValues.customTemplates = true;
      }
      $scope.formValues.externalContributions = !settings.DisplayExternalContributors;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить настройки приложения');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
