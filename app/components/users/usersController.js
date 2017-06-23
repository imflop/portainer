angular.module('users', [])
.controller('UsersController', ['$q', '$scope', '$state', '$sanitize', 'UserService', 'TeamService', 'TeamMembershipService', 'ModalService', 'Notifications', 'Pagination', 'Authentication',
function ($q, $scope, $state, $sanitize, UserService, TeamService, TeamMembershipService, ModalService, Notifications, Pagination, Authentication) {
  $scope.state = {
    userCreationError: '',
    selectedItemCount: 0,
    validUsername: false,
    pagination_count: Pagination.getPaginationCount('users')
  };
  $scope.sortType = 'RoleName';
  $scope.sortReverse = false;

  $scope.formValues = {
    Username: '',
    Password: '',
    ConfirmPassword: '',
    Administrator: false,
    Teams: []
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredUsers, function (user) {
      if (user.Checked !== allSelected) {
        user.Checked = allSelected;
        $scope.selectItem(user);
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

  $scope.checkUsernameValidity = function() {
    var valid = true;
    for (var i = 0; i < $scope.users.length; i++) {
      if ($scope.formValues.Username === $scope.users[i].Username) {
        valid = false;
        break;
      }
    }
    $scope.state.validUsername = valid;
    $scope.state.userCreationError = valid ? '' : 'Данное имя пользователя уже занято';
  };

  $scope.addUser = function() {
    $('#createUserSpinner').show();
    $scope.state.userCreationError = '';
    var username = $sanitize($scope.formValues.Username);
    var password = $sanitize($scope.formValues.Password);
    var role = $scope.formValues.Administrator ? 1 : 2;
    var teamIds = [];
    angular.forEach($scope.formValues.Teams, function(team) {
      teamIds.push(team.Id);
    });
    UserService.createUser(username, password, role, teamIds)
    .then(function success(data) {
      Notifications.success('Пользователь успешно создан', username);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось создать пользователя');
    })
    .finally(function final() {
      $('#createUserSpinner').hide();
    });
  };

  function deleteSelectedUsers() {
    $('#loadUsersSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadUsersSpinner').hide();
      }
    };
    angular.forEach($scope.users, function (user) {
      if (user.Checked) {
        counter = counter + 1;
        UserService.deleteUser(user.Id)
        .then(function success(data) {
          var index = $scope.users.indexOf(user);
          $scope.users.splice(index, 1);
          Notifications.success('Пользователь успешно удален', user.Username);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Не удалось удалить пользователя');
        })
        .finally(function final() {
          complete();
        });
      }
    });
  }

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Вы хотите удалить выбранных пользователей? Они больше не смогут войти в Portainer.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedUsers();
      }
    );
  };

  function assignTeamLeaders(users, memberships) {
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      user.isTeamLeader = false;
      for (var j = 0; j < memberships.length; j++) {
        var membership = memberships[j];
        if (user.Id === membership.UserId && membership.Role === 1) {
          user.isTeamLeader = true;
          user.RoleName = 'team leader';
          break;
        }
      }
    }
  }

  function initView() {
    $('#loadUsersSpinner').show();
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    $scope.isAdmin = isAdmin;
    $q.all({
      users: UserService.users(true),
      teams: isAdmin ? TeamService.teams() : UserService.userLeadingTeams(userDetails.ID),
      memberships: TeamMembershipService.memberships()
    })
    .then(function success(data) {
      var users = data.users;
      assignTeamLeaders(users, data.memberships);
      $scope.users = users;
      $scope.teams = data.teams;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Не удалось получить пользователей и команды');
      $scope.users = [];
      $scope.teams = [];
    })
    .finally(function final() {
      $('#loadUsersSpinner').hide();
    });
  }

  initView();
}]);
