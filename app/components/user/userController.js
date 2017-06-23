angular.module('user', [])
.controller('UserController', ['$q', '$scope', '$state', '$stateParams', 'UserService', 'ModalService', 'Notifications',
function ($q, $scope, $state, $stateParams, UserService, ModalService, Notifications) {

  $scope.state = {
    updatePasswordError: ''
  };

  $scope.formValues = {
    newPassword: '',
    confirmPassword: '',
    Administrator: false
  };

  $scope.deleteUser = function() {
    ModalService.confirmDeletion(
      'Вы хотите удалить этого пользователя? Этот пользователь больше не сможет войти в Portainer.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteUser();
      }
    );
  };

  $scope.updatePermissions = function() {
    $('#loadingViewSpinner').show();
    var role = $scope.formValues.Administrator ? 1 : 2;
    UserService.updateUser($scope.user.Id, undefined, role)
    .then(function success(data) {
      var newRole = role === 1 ? 'administrator' : 'user';
      Notifications.success('Разрешения успешно обновлены', $scope.user.Username + ' is now ' + newRole);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось обновить разрешения пользователя');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.updatePassword = function() {
    $('#loadingViewSpinner').show();
    UserService.updateUser($scope.user.Id, $scope.formValues.newPassword, undefined)
    .then(function success(data) {
      Notifications.success('Пароль успешно обновлен');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось обновить пароль пользователя');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function deleteUser() {
    $('#loadingViewSpinner').show();
    UserService.deleteUser($scope.user.Id)
    .then(function success(data) {
      Notifications.success('Пользователь успешно удален', $scope.user.Username);
      $state.go('users');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось удалить пользователя');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      user: UserService.user($stateParams.id)
    })
    .then(function success(data) {
      var user = data.user;
      $scope.user = user;
      $scope.formValues.Administrator = user.Role === 1 ? true : false;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Невозможно получить информацию о пользователе');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
