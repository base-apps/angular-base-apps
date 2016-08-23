(function() {
  'use strict';

  angular.module('base.core', [
      'base.core.animation'
    ])
    .service('BaseAppsApi', BaseAppsApi)
    .service('BaseAppsAdapter', BaseAppsAdapter)
    .factory('Utils', Utils)
    .run(Setup);
  ;

  BaseAppsApi.$inject = ['BaseAppsAnimation'];

  function BaseAppsApi(BaseAppsAnimation) {
    var listeners  = {};
    var settings   = {};
    var uniqueIds  = [];
    var service    = {};

    service.subscribe           = subscribe;
    service.unsubscribe         = unsubscribe;
    service.publish             = publish;
    service.getSettings         = getSettings;
    service.modifySettings      = modifySettings;
    service.generateUuid        = generateUuid;
    service.toggleAnimate       = toggleAnimate;
    service.closeActiveElements = closeActiveElements;
    service.animate             = animate;
    service.animateAndAdvise    = animateAndAdvise;

    return service;

    function subscribe(name, callback) {
      if (!listeners[name]) {
        listeners[name] = [];
      }

      listeners[name].push(callback);
      return true;
    }

    function unsubscribe(name, callback) {
      var listenerIndex = -1, i, resizeListeners;

      if (listeners[name] !== undefined) {
        if (name == 'resize') {
          resizeListeners = listeners['resize'];
          for (i = 0; i < resizeListeners.length; i++) {
            if (resizeListeners[i] === callback) {
              // listener found
              listenerIndex = i;
              break;
            }
          }

          if (listenerIndex != -1) {
            // remove listener
            resizeListeners.splice(listenerIndex, 1);
          }
        } else {
          // delete all listeners
          delete listeners[name];
        }
      }
      if (typeof callback == 'function') {
          callback.call(this);
      }
    }

    function publish(name, msg) {
      if (!listeners[name]) {
        listeners[name] = [];
      }

      listeners[name].forEach(function(cb) {
        cb(msg);
      });

      return;
    }

    function getSettings() {
      return settings;
    }

    function modifySettings(tree) {
      settings = angular.extend(settings, tree);
      return settings;
    }

    function generateUuid() {
      var uuid = '';

      //little trick to produce semi-random IDs
      do {
        uuid += 'ba-uuid-';
        for (var i=0; i<15; i++) {
          uuid += Math.floor(Math.random()*16).toString(16);
        }
      } while(!uniqueIds.indexOf(uuid));

      uniqueIds.push(uuid);
      return uuid;
    }

    function toggleAnimate(element, futureState) {
      BaseAppsAnimation.toggleAnimate(element, futureState);
    }

    function closeActiveElements(options) {
      var self = this;
      options = options || {};
      var activeElements = document.querySelectorAll('.is-active[ba-closable]');
      // action sheets are nested ba-closable elements, so we have to target the parent
      var nestedActiveElements = document.querySelectorAll('[ba-closable] > .is-active');

      if (activeElements.length) {
        angular.forEach(activeElements, function(el) {
          if (options.exclude !== el.id) {
            self.publish(el.id, 'close');
          }
        });
      }
      if (nestedActiveElements.length) {
        angular.forEach(nestedActiveElements, function(el) {
          var parentId = el.parentNode.id;
          if (options.exclude !== parentId) {
            self.publish(parentId, 'close');
          }
        });
      }
    }

    function animate(element, futureState, animationIn, animationOut) {
      return BaseAppsAnimation.animate(element, futureState, animationIn, animationOut);
    }

    function animateAndAdvise(element, futureState, animationIn, animationOut) {
      var msgPrefix = "animation-" + (futureState ? "open" : "close");
      publish(element[0].id, msgPrefix + "-started");
      var promise = BaseAppsAnimation.animate(element, futureState, animationIn, animationOut);
      promise.then(function() {
        publish(element[0].id, msgPrefix + "-finished");
      }, function() {
        publish(element[0].id, msgPrefix + "-aborted");
      });
      return promise;
    }
  }

  BaseAppsAdapter.$inject = ['BaseAppsApi'];

  function BaseAppsAdapter(BaseAppsApi) {

    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    function activate(target) {
      BaseAppsApi.publish(target, 'show');
    }

    function deactivate(target) {
      BaseAppsApi.publish(target, 'hide');
    }
  }


  function Utils() {
    var utils = {};

    utils.throttle = throttleUtil;

    return utils;

    function throttleUtil(func, delay) {
      var timer = null;

      return function () {
        var context = this, args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  }

  function Setup() {
    // Attach FastClick
    if (typeof(FastClick) !== 'undefined') {
      FastClick.attach(document.body);
    }

    // Attach viewport units buggyfill
    if (typeof(viewportUnitsBuggyfill) !== 'undefined') {
      viewportUnitsBuggyfill.init();
    }
  }

})();