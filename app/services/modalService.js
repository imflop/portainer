angular.module('portainer.services')
.factory('ModalService', [function ModalServiceFactory() {
  'use strict';
  var service = {};

  var applyBoxCSS = function(box) {
    box.css({
      'top': '50%',
      'margin-top': function () {
        return -(box.height() / 2);
      }
    });
  };

  var confirmButtons = function(options) {
    var buttons = {
      confirm: {
        label: options.buttons.confirm.label,
        className: options.buttons.confirm.className
      },
      cancel: {
        label: options.buttons.cancel && options.buttons.cancel.label ? options.buttons.cancel.label : 'Cancel'
      }
    };
    return buttons;
  };

  service.confirm = function(options){
    var box = bootbox.confirm({
      title: options.title,
      message: options.message,
      buttons: confirmButtons(options),
      callback: options.callback
    });
    applyBoxCSS(box);
  };

  service.prompt = function(options){
    var box = bootbox.prompt({
      title: options.title,
      inputType: options.inputType,
      inputOptions: options.inputOptions,
      buttons: confirmButtons(options),
      callback: options.callback
    });
    applyBoxCSS(box);
  };

  service.confirmAccessControlUpdate = function(callback, msg) {
    service.confirm({
      title: 'Вы уверены ?',
      message: 'Изменение владельца этого ресурса может ограничить его управления для некоторых пользователей.',
      buttons: {
        confirm: {
          label: 'Изменит владение',
          className: 'btn-primary'
        }
      },
      callback: callback
    });
  };

  service.confirmImageForceRemoval = function(callback) {
    service.confirm({
      title: 'Вы уверены ?',
      message: 'Принудительно удалить образ, даже если оно имеет несколько тегов, или если он используется в остановленных контейнерах.',
      buttons: {
        confirm: {
          label: 'Удалить образ',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmDeletion = function(message, callback) {
    service.confirm({
      title: 'Вы уверены ?',
      message: message,
      buttons: {
        confirm: {
          label: 'Удалить',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  service.confirmContainerDeletion = function(title, callback) {
    service.prompt({
      title: title,
      inputType: 'checkbox',
      inputOptions: [
        {
          text: 'Автоматически удалить не сохраненные тома<i></i>',
          value: '1'
        }
      ],
      buttons: {
        confirm: {
          label: 'Удалить',
          className: 'btn-danger'
        }
      },
      callback: callback
    });
  };

  return service;
}]);
