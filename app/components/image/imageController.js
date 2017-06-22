angular.module('image', [])
.controller('ImageController', ['$scope', '$stateParams', '$state', '$timeout', 'ImageService', 'RegistryService', 'Notifications',
function ($scope, $stateParams, $state, $timeout, ImageService, RegistryService, Notifications) {
	$scope.formValues = {
		Image: '',
		Registry: ''
	};

	$scope.tagImage = function() {
		$('#loadingViewSpinner').show();
		var image = $scope.formValues.Image;
		var registry = $scope.formValues.Registry;

		ImageService.tagImage($stateParams.id, image, registry.URL)
		.then(function success(data) {
			Notifications.success('Образ успешно помечен');
			$state.go('image', {id: $stateParams.id}, {reload: true});
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Не удалось пометить образ');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.pushTag = function(repository) {
		$('#loadingViewSpinner').show();
		RegistryService.retrieveRegistryFromRepository(repository)
		.then(function success(data) {
			var registry = data;
			return ImageService.pushImage(repository, registry);
		})
		.then(function success(data) {
			Notifications.success('Образ успешно отправлен', repository);
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Не удалось отправить образ в репозиторий');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.pullTag = function(repository) {
		$('#loadingViewSpinner').show();
		RegistryService.retrieveRegistryFromRepository(repository)
		.then(function success(data) {
			var registry = data;
			return ImageService.pullImage(repository, registry);
		})
		.then(function success(data) {
			Notifications.success('Образ успешно стянут', repository);
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Не удалось стянуть образ');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.removeTag = function(repository) {
		$('#loadingViewSpinner').show();
		ImageService.deleteImage(repository, false)
		.then(function success() {
			if ($scope.image.RepoTags.length === 1) {
				Notifications.success('Образ успешно удален', repository);
				$state.go('images', {}, {reload: true});
			} else {
				Notifications.success('Тег успешно удален', repository);
				$state.go('image', {id: $stateParams.id}, {reload: true});
			}
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Не удалось удалить образ');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.removeImage = function (id) {
		$('#loadingViewSpinner').show();
		ImageService.deleteImage(id, false)
		.then(function success() {
			Notifications.success('Образ успешно удален', id);
			$state.go('images', {}, {reload: true});
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Не удалось удалить образ');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	function retrieveImageDetails() {
		$('#loadingViewSpinner').show();
		ImageService.image($stateParams.id)
		.then(function success(data) {
			$scope.image = data;
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Не удалось получить детали образа');
			$state.go('images');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	}

	retrieveImageDetails();
}]);
