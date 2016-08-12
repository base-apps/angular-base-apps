(function() {
  'use strict';

  angular.module('base.offcanvas', ['base.core'])
    .directive('baOffcanvas', baOffcanvas)
    .service('BaseAppsOffcanvas', BaseAppsOffcanvas)
  ;

  BaseAppsOffcanvas.$inject = ['BaseAppsApi'];

  function BaseAppsOffcanvas(BaseAppsApi) {
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

    function toggle(target) {
      BaseAppsApi.publish(target, 'toggle');
    }
  }

  baOffcanvas.$inject = ['BaseAppsApi'];

  function baOffcanvas(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/offcanvas/offcanvas.html',
      transclude: true,
      scope: {
        position: '@'
      },
      replace: true,
      compile: compile
    };

    return directive;

    function compile(tElement, tAttrs, transclude) {
      var type = 'offcanvas';

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
        iAttrs.$set('ba-closable', type);
        document.body.classList.add('has-off-canvas');
      }

      function postLink(scope, element, attrs) {
        scope.position = scope.position || 'left';
        scope.active = false;

        scope.$on("$destroy", function() {
          BaseAppsApi.unsubscribe(attrs.id);
        });

        //setup
        BaseAppsApi.subscribe(attrs.id, function(msg) {
          if(msg === 'show' || msg === 'open') {
            scope.show();
          } else if (msg === 'close' || msg === 'hide') {
            scope.hide();
          } else if (msg === 'toggle') {
            scope.toggle();
          }

          if (!scope.$root.$$phase) {
            scope.$apply();
          }

          return;
        });

        scope.hide = function() {
          scope.active = false;
          adviseActiveChanged();
          return;
        };

        scope.show = function() {
          scope.active = true;
          adviseActiveChanged();
          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          return;
        };

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.baAdvise)) {
            BaseAppsApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

})();
