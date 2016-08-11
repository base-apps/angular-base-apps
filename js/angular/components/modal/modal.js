(function() {
  'use strict';

  angular.module('foundation.modal', ['foundation.core'])
    .directive('zfModal', modalDirective)
    .factory('ModalFactory', ModalFactory)
    .service('FoundationModal', FoundationModal)
  ;

  angular.module('base.modal', ['base.core'])
    .directive('zfModal', modalDirective)
    .factory('ModalFactory', ModalFactory)
    .factory('ConfirmModal', ConfirmModal)
    .factory('PromptModal', PromptModal)
    .service('FoundationModal', FoundationModal)
  ;

  FoundationModal.$inject = ['FoundationApi', 'ModalFactory'];

  function FoundationModal(foundationApi, ModalFactory) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;
    service.newModal = newModal;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }

    //new modal has to be controlled via the new instance
    function newModal(config) {
      return new ModalFactory(config);
    }
  }

  modalDirective.$inject = ['FoundationApi'];

  function modalDirective(foundationApi) {

    var directive = {
      restrict: 'EA',
      templateUrl: 'components/modal/modal.html',
      transclude: true,
      scope: true,
      replace: true,
      compile: compile
    };

    return directive;

    function compile(tElement, tAttrs, transclude) {
      var type = 'modal';

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
          iAttrs.$set('zf-closable', type);
      }

      function postLink(scope, element, attrs) {
        var dialog = angular.element(element.children()[0]);
        var animateFn = attrs.hasOwnProperty('zfAdvise') ? foundationApi.animateAndAdvise : foundationApi.animate;

        scope.active = false;
        scope.overlay = attrs.overlay === 'false' ? false : true;
        scope.destroyOnClose = attrs.destroyOnClose === 'true' ? true : false;
        scope.overlayClose = attrs.overlayClose === 'false' ? false : true;

        var animationIn = attrs.animationIn || 'fadeIn';
        var animationOut = attrs.animationOut || 'fadeOut';

        var overlayIn = 'fadeIn';
        var overlayOut = 'fadeOut';

        scope.hideOverlay = function($event) {
          if($event.target.id == attrs.id && scope.overlayClose) {
            foundationApi.publish(attrs.id, 'close');
          }
        };

        scope.hide = function() {
          if (scope.active) {
            scope.active = false;
            adviseActiveChanged();

            if (scope.destroyOnClose) {
              animate().then(function() {
                element.remove();
                scope.$destroy();
              });
            } else {
              animate();
            }
          } else {
            if (scope.destroyOnClose) {
              $timeout(function() {
                element.remove();
                scope.$destroy();
              }, 0, false);
            }
          }
          return;
        };

        scope.show = function() {
          if (!scope.active) {
            scope.active = true;
            adviseActiveChanged();
            animate();
            dialog.tabIndex = -1;
            dialog[0].focus();
          }
          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          animate();
          return;
        };

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe(attrs.id);
        });

        //setup
        foundationApi.subscribe(attrs.id, function(msg) {
          if(msg === 'show' || msg === 'open') {
            scope.show();
          } else if (msg === 'close' || msg === 'hide') {
            scope.hide();
          } else if (msg === 'toggle') {
            scope.toggle();
          }

          if (scope.$root && !scope.$root.$$phase) {
            scope.$apply();
          }

          return;
        });

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }

        function animate() {
          //animate both overlay and dialog
          if(!scope.overlay) {
            element.css('background', 'transparent');
          }

          // work around for modal animations
          // due to a bug where the overlay fadeIn is essentially covering up
          // the dialog's animation
          if (!scope.active) {
            foundationApi.animate(element, scope.active, overlayIn, overlayOut);
          }
          else {
            element.addClass('is-active');
          }

          return animateFn(dialog, scope.active, animationIn, animationOut);
        }
      }
    }
  }

  ModalFactory.$inject = ['$http', '$templateCache', '$rootScope', '$compile', '$timeout', '$q', 'FoundationApi'];

  function ModalFactory($http, $templateCache, $rootScope, $compile, $timeout, $q, foundationApi) {
    return modalFactory;

    function modalFactory(config) {
      var self = this, //for prototype functions
          container = angular.element(config.container || document.body),
          id = config.id || foundationApi.generateUuid(),
          attached = false,
          destroyed = false,
          activated = false,
          html,
          element,
          fetched,
          scope,
          contentScope
      ;

      var props = [
        'animationIn',
        'animationOut',
        'overlay',
        'overlayClose',
        'destroyOnClose',
        'ignoreAllClose',
        'class'
      ];

      if(config.templateUrl) {
        //get template
        fetched = $http.get(config.templateUrl, {
          cache: $templateCache
        }).then(function (response) {
          html = response.data;
          assembleDirective();
        });

      } else if(config.template) {
        //use provided template
        fetched = true;
        html = config.template;
        assembleDirective();
      }

      self.isActive = isActive;
      self.activate = activate;
      self.deactivate = deactivate;
      self.toggle = toggle;
      self.destroy = destroy;

      return {
        isActive: isActive,
        activate: activate,
        deactivate: deactivate,
        toggle: toggle,
        destroy: destroy
      };

      function checkStatus() {
        if(destroyed) {
          throw "Error: Modal was destroyed. Delete the object and create a new ModalFactory instance."
        }
      }

      function isActive() {
        return !destroyed && scope && activated;
      }

      function activate() {
        checkStatus();
        $timeout(function() {
          activated = true;
          init('show');
        }, 0, false);
      }

      function deactivate() {
        checkStatus();
        $timeout(function() {
          activated = false;
          init('hide');
        }, 0, false);
      }

      function toggle() {
        checkStatus();
        $timeout(function() {
          activated = !activated;
          init('toggle');
        }, 0, false);
      }

      function init(msg) {
        $q.when(fetched).then(function() {
          var delayMsg = false;

          if(!attached && html.length > 0) {
            container.append(element);
            $compile(element)(scope);
            attached = true;

            // delay message so directive can be compiled and respond to messages
            delayMsg = true;
          }

          if (delayMsg) {
            $timeout(function() {
              foundationApi.publish(id, msg);
            }, 0, false);
          } else {
            foundationApi.publish(id, msg);
          }
        });
      }

      function assembleDirective() {
        // check for duplicate elements to prevent factory from cloning modals
        if (document.getElementById(id)) {
          return;
        }

        html = '<zf-modal id="' + id + '">' + html + '</zf-modal>';

        element = angular.element(html);

        scope = $rootScope.$new();

        // account for directive attributes and modal classes
        for(var i = 0; i < props.length; i++) {
          var prop = props[i];

          if(angular.isDefined(config[prop])) {
            switch (prop) {
              case 'animationIn':
                element.attr('animation-in', config[prop]);
                break;
              case 'animationOut':
                element.attr('animation-out', config[prop]);
                break;
              case 'overlayClose':
                // must be string, see postLink() above
                element.attr('overlay-close', (config[prop] === 'false' || config[prop] === false) ? 'false' : 'true');
                break;
              case 'destroyOnClose':
                // must be string, see postLink() above
                element.attr('destroy-on-close', (config[prop] === 'true' || config[prop] === true) ? 'true' : 'false');
                break;
              case 'ignoreAllClose':
                element.attr('zf-ignore-all-close', 'zf-ignore-all-close');
                break;
              case 'class':
                if (angular.isString(config[prop])) {
                  config[prop].split(' ').forEach(function(klass) {
                    element.addClass(klass);
                  });
                } else if (angular.isArray(config[prop])) {
                  config[prop].forEach(function(klass) {
                    element.addClass(klass);
                  });
                }
                break;
              default:
                element.attr(prop, config[prop]);
                break;
            }
          }
        }
        // access view scope variables
        if (config.contentScope) {
          contentScope = config.contentScope;
          for (var prop in config.contentScope) {
            if (config.contentScope.hasOwnProperty(prop)) {
              scope[prop] = config.contentScope[prop];
            }
          }
        }
      }

      function destroy() {
        self.deactivate();
        $timeout(function() {
          scope.$destroy();
          element.remove();
          destroyed = true;
        }, 0, false);
        foundationApi.unsubscribe(id);
      }

    }

  }

  ConfirmModal.$inject = ['$timeout', 'ModalFactory'];

  function ConfirmModal($timeout, ModalFactory) {
    var ConfirmModal = function(config) {
      var modal = this;

      ModalFactory.call(this, {
        'class': 'tiny dialog confirm-modal',
        'overlay': true,
        'overlayClose': false,
        'destroyOnClose': true,
        'templateUrl': 'components/modal/modal-confirm.html',
        'contentScope': {
          title: config.title,
          content: config.content,
          enterText: config.enterText || "Enter",
          cancelText: config.cancelText || "Cancel",
          enterFirst: angular.isDefined(config.enterFirst) ? config.enterFirst : true,
          enter: function() {
            if (config.enterCallback) {
              config.enterCallback();
            }
            modal.deactivate();
          },
          cancel: function() {
            if (config.cancelCallback) {
              config.cancelCallback();
            }
            modal.deactivate();
          }
        }
      });

      modal.activate();
    }

    ConfirmModal.prototype = Object.create(ModalFactory.prototype);

    return ConfirmModal;
  }

  PromptModal.$inject = ['$timeout', 'ModalFactory'];

  function PromptModal($timeout, ModalFactory) {
    var PromptModal = function(config) {
      var modal = this;
      var data = {};

      ModalFactory.call(this, {
        'class': 'tiny dialog prompt-modal',
        'overlay': true,
        'overlayClose': false,
        'destroyOnClose': true,
        'templateUrl': 'components/modal/modal-prompt.html',
        'contentScope': {
          title: config.title,
          content: config.content,
          data: data,
          inputType: config.inputType || "text",
          enterText: config.enterText || "Enter",
          cancelText: config.cancelText || "Cancel",
          enterFirst: angular.isDefined(config.enterFirst) ? config.enterFirst : true,
          enter: function() {
            if (!config.requireInput || (angular.isDefined(data.value) && data.value !== "")) {
              if (config.enterCallback) {
                config.enterCallback(data.value);
              }
              modal.deactivate();
            }
          },
          cancel: function() {
            if (config.cancelCallback) {
              config.cancelCallback();
            }
            modal.deactivate();
          }
        }
      });

      modal.activate();
    }

    PromptModal.prototype = Object.create(ModalFactory.prototype);

    return PromptModal;
  }

})();
