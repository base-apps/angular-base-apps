(function() {
  'use strict';

  angular.module('base.popup', ['base.core'])
    .directive('baPopup', baPopup)
    .directive('baPopupToggle', baPopupToggle)
    .service('BaseAppsPopup', BaseAppsPopup)
  ;

  BaseAppsPopup.$inject = ['BaseAppsApi'];

  function BaseAppsPopup(BaseAppsApi) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      BaseAppsApi.publish(target, ['show']);
    }

    //target should be element ID
    function deactivate(target) {
      BaseAppsApi.publish(target, ['hide']);
    }

    function toggle(target, popupTarget) {
      BaseAppsApi.publish(target, ['toggle', popupTarget]);
    }
  }

  baPopup.$inject = ['BaseAppsApi'];

  function baPopup(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/popup/popup.html',
      scope: {
        pinTo: '@?',
        pinAt: '@?',
        target: '@?'
      },
      compile: compile
    };

    return directive;

    function compile() {
      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs) {
        iAttrs.$set('ba-closable', 'popup');
      }

      function postLink(scope, element, attrs) {
        scope.active = false;
        scope.target = scope.target || false;

        var attachment = scope.pinTo || 'top center';
        var targetAttachment = scope.pinAt || 'bottom center';
        var tetherInit = false;
        var tether     = {};

        //setup
        BaseAppsApi.subscribe(attrs.id, function(msg) {
          if(msg[0] === 'show' || msg[0] === 'open') {
            scope.show(msg[1]);
          } else if (msg[0] === 'close' || msg[0] === 'hide') {
            scope.hide();
          } else if (msg[0] === 'toggle') {
            scope.toggle(msg[1]);
          }

          scope.$apply();

          return;
        });


        scope.hide = function() {
          if (scope.active) {
            scope.active = false;
            adviseActiveChanged();
            tetherElement();
            tether.disable();
          }

          return;
        };

        scope.show = function(newTarget) {
          if (!scope.active) {
            scope.active = true;
            adviseActiveChanged();
            tetherElement(newTarget);
            tether.enable();
          }

          return;
        };

        scope.toggle = function(newTarget) {
          scope.active = !scope.active;
          adviseActiveChanged();
          tetherElement(newTarget);

          if(scope.active) {
            tether.enable();
          } else  {
            tether.disable();
          }

          return;
        };

        scope.$on('$destroy', function() {
          BaseAppsApi.unsubscribe(attrs.id);

          scope.active = false;
          if(tetherInit) {
            tether.destroy();
            element.remove();
            tetherInit = false;
          }
        });

        function tetherElement(target) {
          if(tetherInit) {
            return;
          }

          scope.target = scope.target ? document.getElementById(scope.target) : document.getElementById(target);

          tether = new Tether({
            element: element[0],
            target: scope.target,
            attachment: attachment,
            targetAttachment: targetAttachment,
            enable: false
          });

          tetherInit = true;
        }

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.baAdvise)) {
            BaseAppsApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

  baPopupToggle.$inject = ['BaseAppsApi'];

  function baPopupToggle(BaseAppsApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      var target = attrs.baPopupToggle;
      var id = attrs.id || BaseAppsApi.generateUuid();
      attrs.$set('id', id);

      element.on('click', function(e) {
        BaseAppsApi.publish(target, ['toggle', id]);
        e.preventDefault();
      });
    }
  }

})();
