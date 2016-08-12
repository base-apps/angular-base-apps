(function() {
  'use strict';

  angular.module('base.panel', ['base.core'])
    .directive('baPanel', baPanel)
    .service('BaseAppsPanel', BaseAppsPanel)
  ;

  BaseAppsPanel.$inject = ['BaseAppsApi'];

  function BaseAppsPanel(BaseAppsApi) {
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

  baPanel.$inject = ['BaseAppsApi', '$window'];

  function baPanel(BaseAppsApi, $window) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/panel/panel.html',
      transclude: true,
      scope: {
        position: '@?'
      },
      replace: true,
      compile: compile
    };

    return directive;

    function compile(tElement, tAttrs, transclude) {
      var type = 'panel';
      var animate = tAttrs.hasOwnProperty('baAdvise') ? BaseAppsApi.animateAndAdvise : BaseAppsApi.animate;
      var forceAnimation = tAttrs.hasOwnProperty('forceAnimation');

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
        iAttrs.$set('ba-closable', type);
        scope.position = scope.position || 'left';
        scope.positionClass = 'panel-' + scope.position;
      }

      function postLink(scope, element, attrs) {
        scope.active = false;
        var animationIn, animationOut;
        var globalQueries = BaseAppsApi.getSettings().mediaQueries;
        var setAnim = {
          left: function(){
            animationIn  = attrs.animationIn || 'slideInRight';
            animationOut = attrs.animationOut || 'slideOutLeft';
          },
          right: function(){
            animationIn  = attrs.animationIn || 'slideInLeft';
            animationOut = attrs.animationOut || 'slideOutRight';
          },
          top: function(){
            animationIn  = attrs.animationIn || 'slideInDown';
            animationOut = attrs.animationOut || 'slideOutUp';
          },
          bottom: function(){
            animationIn  = attrs.animationIn || 'slideInUp';
            animationOut = attrs.animationOut || 'slideOutDown';
          }
        };
        setAnim[scope.position]();
        //urgh, there must be a better way, ***there totally is btw***
        // if(scope.position === 'left') {
        //   animationIn  = attrs.animationIn || 'slideInRight';
        //   animationOut = attrs.animationOut || 'slideOutLeft';
        // } else if (scope.position === 'right') {
        //   animationIn  = attrs.animationIn || 'slideInLeft';
        //   animationOut = attrs.animationOut || 'slideOutRight';
        // } else if (scope.position === 'top') {
        //   animationIn  = attrs.animationIn || 'slideInDown';
        //   animationOut = attrs.animationOut || 'slideOutUp';
        // } else if (scope.position === 'bottom') {
        //   animationIn  = attrs.animationIn || 'slideInUp';
        //   animationOut = attrs.animationOut || 'slideOutDown';
        // }

        scope.$on("$destroy", function() {
          BaseAppsApi.unsubscribe(attrs.id);
        });

        //setup
        BaseAppsApi.subscribe(attrs.id, function(msg) {
          var panelPosition = $window.getComputedStyle(element[0]).getPropertyValue("position");

          if (!forceAnimation) {
            // patch to prevent panel animation on larger screen devices
            // don't run animation on grid elements, only panel
            if (panelPosition == 'static' || panelPosition == 'relative') {
              return;
            }
          }

          if(msg == 'show' || msg == 'open') {
            scope.show();
          } else if (msg == 'close' || msg == 'hide') {
            scope.hide();
          } else if (msg == 'toggle') {
            scope.toggle();
          }

          if (!scope.$root.$$phase) {
            scope.$apply();
          }

          return;
        });

        scope.hide = function() {
          if(scope.active){
            scope.active = false;
            adviseActiveChanged();
            animate(element, scope.active, animationIn, animationOut);
          }

          return;
        };

        scope.show = function() {
          if(!scope.active){
            scope.active = true;
            adviseActiveChanged();
            animate(element, scope.active, animationIn, animationOut);
          }

          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          animate(element, scope.active, animationIn, animationOut);
          return;
        };

        element.on('click', function(e) {
          // Check sizing
          var srcEl = e.target;

          if (!matchMedia(globalQueries.medium).matches && srcEl.href && srcEl.href.length > 0) {
            // Hide element if it can't match at least medium
            scope.hide();
          }
        });

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.baAdvise)) {
            BaseAppsApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

})();
