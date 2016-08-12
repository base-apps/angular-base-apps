(function() {
  'use strict';

  angular.module('base.actionsheet', ['base.core'])
    .controller('baActionSheetController', baActionSheetController)
    .directive('baActionSheet', baActionSheet)
    .directive('baAsContent', baAsContent)
    .directive('baAsButton', baAsButton)
    .service('BaseAppsActionSheet', BaseAppsActionSheet)
  ;

  BaseAppsActionSheet.$inject = ['BaseAppsApi'];

  function BaseAppsActionSheet(BaseAppsApi) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      BaseAppsApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      BaseAppsApi.publish(target, 'hide');
    }
  }

  baActionSheetController.$inject = ['$scope', 'BaseAppsApi'];

  function baActionSheetController($scope, BaseAppsApi) {
    var controller = this;
    var content = controller.content = $scope.content;
    var container = controller.container = $scope.container;
    var body = angular.element(document.body);

    controller.registerContent = function(scope) {
      content = scope;
      content.active = false;
    };

    controller.registerContainer = function(scope) {
      container = scope;
      container.active = false;
    };

    controller.toggle = toggle;
    controller.hide = hide;
    controller.show = show;

    controller.registerListener = function() {
      document.body.addEventListener('click', listenerLogic);
    };

    controller.deregisterListener = function() {
      document.body.removeEventListener('click', listenerLogic);
    }

    function listenerLogic(e) {
      var el = e.target;
      var insideActionSheet = false;

      do {
        if(el.classList && el.classList.contains('action-sheet-container')) {
          insideActionSheet = true;
          break;
        }

      } while ((el = el.parentNode));

      if(!insideActionSheet) {
        // if the element has a toggle attribute, do nothing
        if (e.target.attributes['ba-toggle'] || e.target.attributes['ba-hard-toggle']) {
          return;
        };
        // if the element is outside the action sheet and is NOT a toggle element, hide
        hide();
      }
    }

    function hide() {
      content.hide();
      container.hide();

      if (!$scope.$$phase) {
        content.$apply();
        container.$apply();
      }
    }

    function toggle() {
      content.toggle();
      container.toggle();

      if (!$scope.$$phase) {
        content.$apply();
        container.$apply();
      }
    }

    function show() {
      content.show();
      container.show();

      if (!$scope.$$phase) {
        content.$apply();
        container.$apply();
      }
    }
  }

  baActionSheet.$inject = ['BaseAppsApi'];

  function baActionSheet(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/actionsheet/actionsheet.html',
      controller: 'baActionSheetController',
      compile: compile
    };

    return directive;

    function compile() {

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs) {
        iAttrs.$set('ba-closable', 'actionsheet');
      }

      function postLink(scope, element, attrs, controller) {
        var id = attrs.id || BaseAppsApi.generateUuid();
        attrs.$set('id', id);

        scope.active = false;

        BaseAppsApi.subscribe(id, function(msg) {
          if (msg === 'toggle') {
            controller.toggle();
          }

          if (msg === 'hide' || msg === 'close') {
            controller.hide();
          }

          if (msg === 'show' || msg === 'open') {
            controller.show();
          }
        });

        controller.registerContainer(scope);

        scope.toggle = function() {
          scope.active = !scope.active;
          return;
        };

        scope.hide = function() {
          scope.active = false;
          return;
        };

        scope.show = function() {
          scope.active = true;
          return;
        };

        scope.$on("$destroy", function() {
          BaseAppsApi.unsubscribe(id);
        });
      }
    }
  }

  baAsContent.$inject = ['BaseAppsApi'];

  function baAsContent(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/actionsheet/actionsheet-content.html',
      require: '^baActionSheet',
      scope: {
        position: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.active = false;
      scope.position = scope.position || 'bottom';
      controller.registerContent(scope);

      scope.toggle = function() {
        scope.active = !scope.active;
        if(scope.active) {
          controller.registerListener();
        } else {
          controller.deregisterListener();
        }

        return;
      };

      scope.hide = function() {
        scope.active = false;
        controller.deregisterListener();
        return;
      };

      scope.show = function() {
        scope.active = true;
        controller.registerListener();
        return;
      };
    }
  }

  baAsButton.$inject = ['BaseAppsApi'];

  function baAsButton(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/actionsheet/actionsheet-button.html',
      require: '^baActionSheet',
      scope: {
        title: '@?'
      },
      link: link
    }

    return directive;

    function link(scope, element, attrs, controller) {

      element.on('click', function(e) {
        controller.toggle();
        e.preventDefault();
      });

    }
  }

})();
