(function() {
  'use strict';

  angular.module('base.notification', ['base.core'])
    .controller('baNotificationController', baNotificationController)
    .directive('baNotificationSet', baNotificationSet)
    .directive('baNotification', baNotification)
    .directive('baNotificationStatic', baNotificationStatic)
    .directive('baNotify', baNotify)
    .factory('NotificationFactory', NotificationFactory)
    .service('BaseAppsNotification', BaseAppsNotification)
  ;

  BaseAppsNotification.$inject = ['BaseAppsApi', 'NotificationFactory'];

  function BaseAppsNotification(BaseAppsApi, NotificationFactory) {
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

    function createNotificationSet(config) {
      return new NotificationFactory(config);
    }
  }


  baNotificationController.$inject = ['$scope', 'BaseAppsApi'];

  function baNotificationController($scope, BaseAppsApi) {
    var controller    = this;
    controller.notifications = $scope.notifications = $scope.notifications || [];

    controller.addNotification = function(info) {
      var id  = BaseAppsApi.generateUuid();
      info.id = id;
      $scope.notifications.push(info);
    };

    controller.removeNotification = function(id) {
      $scope.notifications.forEach(function(notification) {
        if(notification.id === id) {
          var ind = $scope.notifications.indexOf(notification);
          $scope.notifications.splice(ind, 1);
        }
      });
    };

    controller.clearAll = function() {
      while($scope.notifications.length > 0) {
        $scope.notifications.pop();
      }
    };
  }

  baNotificationSet.$inject = ['BaseAppsApi'];

  function baNotificationSet(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/notification/notification-set.html',
      controller: 'baNotificationController',
      replace: true,
      scope: {
        position: '@'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.position = scope.position ? scope.position.split(' ').join('-') : 'top-right';

      scope.$on("$destroy", function() {
        BaseAppsApi.unsubscribe(attrs.id);
      });

      BaseAppsApi.subscribe(attrs.id, function(msg) {
        if(msg === 'clearall') {
          controller.clearAll();
        }
        else {
          controller.addNotification(msg);
          if (!scope.$root.$$phase) {
            scope.$apply();
          }
        }
      });
    }
  }

  baNotification.$inject = ['BaseAppsApi', '$sce'];

  function baNotification(BaseAppsApi, $sce) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/notification/notification.html',
      replace: true,
      transclude: true,
      require: '^baNotificationSet',
      controller: function() { },
      scope: {
        title: '=?',
        content: '=?',
        image: '=?',
        notifId: '=',
        color: '=?',
        autoclose: '=?'
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
        iAttrs.$set('ba-closable', 'notification');
        if (iAttrs['title']) {
          scope.$watch('title', function(value) {
            if (value) {
              scope.trustedTitle = $sce.trustAsHtml(value);
            }
          });
        }
      }

      function postLink(scope, element, attrs, controller) {
        scope.active = false;
        var animationIn  = attrs.animationIn || 'fadeIn';
        var animationOut = attrs.animationOut || 'fadeOut';
        var animate = attrs.hasOwnProperty('baAdvise') ? BaseAppsApi.animateAndAdvise : BaseAppsApi.animate;
        var hammerElem;

        //due to dynamic insertion of DOM, we need to wait for it to show up and get working!
        setTimeout(function() {
          scope.active = true;
          adviseActiveChanged();
          animate(element, scope.active, animationIn, animationOut);
        }, 50);

        scope.hide = function() {
          scope.active = false;
          adviseActiveChanged();
          animate(element, scope.active, animationIn, animationOut);
          setTimeout(function() {
            controller.removeNotification(scope.notifId);
          }, 50);
        };

        // close if autoclose
        if (scope.autoclose) {
          setTimeout(function() {
            if (scope.active) {
              scope.hide();
            }
          }, parseInt(scope.autoclose));
        };

        // close on swipe
        if (typeof(Hammer) !== 'undefined') {
          hammerElem = new Hammer(element[0]);
          // set the options for swipe (to make them a bit more forgiving in detection)
          hammerElem.get('swipe').set({
            direction: Hammer.DIRECTION_ALL,
            threshold: 5, // this is how far the swipe has to travel
            velocity: 0.5 // and this is how fast the swipe must travel
          });
        }
        if(typeof(hammerElem) !== 'undefined') {
          hammerElem.on('swipe', function() {
            if (scope.active) {
              scope.hide();
            }
          });
        }

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.baAdvise)) {
            BaseAppsApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

  baNotificationStatic.$inject = ['BaseAppsApi', '$sce'];

  function baNotificationStatic(BaseAppsApi, $sce) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/notification/notification-static.html',
      replace: true,
      transclude: true,
      scope: {
        title: '@?',
        content: '@?',
        image: '@?',
        color: '@?',
        autoclose: '@?'
      },
      compile: compile
    };

    return directive;

    function compile() {
      var type = 'notification';

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
        iAttrs.$set('ba-closable', type);
        if (iAttrs['title']) {
          scope.trustedTitle = $sce.trustAsHtml(iAttrs['title']);
        }
      }

      function postLink(scope, element, attrs, controller) {
        scope.position = attrs.position ? attrs.position.split(' ').join('-') : 'top-right';

        var animationIn = attrs.animationIn || 'fadeIn';
        var animationOut = attrs.animationOut || 'fadeOut';
        var animateFn = attrs.hasOwnProperty('baAdvise') ? BaseAppsApi.animateAndAdvise : BaseAppsApi.animate;

        scope.$on("$destroy", function() {
          BaseAppsApi.unsubscribe(attrs.id);
        });

        //setup
        BaseAppsApi.subscribe(attrs.id, function(msg) {
          if(msg == 'show' || msg == 'open') {
            scope.show();
            // close if autoclose
            if (scope.autoclose) {
              setTimeout(function() {
                if (scope.active) {
                  scope.hide();
                }
              }, parseInt(scope.autoclose));
            };
          } else if (msg == 'close' || msg == 'hide') {
            scope.hide();
          } else if (msg == 'toggle') {
            scope.toggle();
            // close if autoclose
            if (scope.autoclose) {
              setTimeout(function() {
                if (scope.active) {
                  scope.toggle();
                }
              }, parseInt(scope.autoclose));
            }
          }
          return;
        });

        scope.hide = function() {
          if (scope.active) {
            scope.active = false;
            adviseActiveChanged();
            animateFn(element, scope.active, animationIn, animationOut);
          }
          return;
        };

        scope.show = function() {
          if (!scope.active) {
            scope.active = true;
            adviseActiveChanged();
            animateFn(element, scope.active, animationIn, animationOut);
          }
          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          animateFn(element, scope.active, animationIn, animationOut);
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

  baNotify.$inject = ['BaseAppsApi'];

  function baNotify(BaseAppsApi) {
    var directive = {
      restrict: 'A',
      scope: {
        title: '@?',
        content: '@?',
        color: '@?',
        image: '@?',
        autoclose: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      element.on('click', function(e) {
        BaseAppsApi.publish(attrs.baNotify, {
          title: scope.title,
          content: scope.content,
          color: scope.color,
          image: scope.image,
          autoclose: scope.autoclose
        });
        e.preventDefault();
      });
    }
  }

  NotificationFactory.$inject = ['$http', '$templateCache', '$rootScope', '$compile', '$timeout', 'BaseAppsApi', '$sce'];

  function NotificationFactory($http, $templateCache, $rootScope, $compile, $timeout, BaseAppsApi, $sce) {
    return notificationFactory;

    function notificationFactory(config) {
      var self = this, //for prototype functions
          container = angular.element(config.container || document.body),
          id = config.id || BaseAppsApi.generateUuid(),
          attached = false,
          destroyed = false,
          html,
          element,
          scope,
          contentScope
      ;

      var props = [
        'position'
      ];

      assembleDirective();

      self.addNotification = addNotification;
      self.clearAll = clearAll;
      self.destroy = destroy;

      return {
        addNotification: addNotification,
        clearAll: clearAll,
        destroy: destroy
      };

      function checkStatus() {
        if(destroyed) {
          throw "Error: Notification Set was destroyed. Delete the object and create a new NotificationFactory instance."
        }
      }

      function addNotification(notification) {
        checkStatus();
        $timeout(function() {
          BaseAppsApi.publish(id, notification);
        }, 0, false);
      }

      function clearAll() {
        checkStatus();
        $timeout(function() {
          BaseAppsApi.publish(id, 'clearall');
        }, 0, false);
      }

      function init(state) {
        if(!attached && html.length > 0) {
          var modalEl = container.append(element);

          scope.active = state;
          $compile(element)(scope);

          attached = true;
        }
      }

      function assembleDirective() {
        // check for duplicate element to prevent factory from cloning notification sets
        if (document.getElementById(id)) {
          return;
        }
        html = '<ba-notification-set id="' + id + '"></ba-notification-set>';

        element = angular.element(html);

        scope = $rootScope.$new();

        for(var i = 0; i < props.length; i++) {
          if(config[props[i]]) {
            element.attr(props[i], config[props[i]]);
          }
        }

        // access view scope variables
        if (config.contentScope) {
          contentScope = config.contentScope;
          for (var prop in contentScope) {
            if (contentScope.hasOwnProperty(prop)) {
              scope[prop] = contentScope[prop];
            }
          }
        }
        init(true);
      }

      function destroy() {
        self.clearAll();
        setTimeout(function() {
          scope.$destroy();
          element.remove();
          destroyed = true;
        }, 3000);
        BaseAppsApi.unsubscribe(id);
      }

    }

  }
})();
