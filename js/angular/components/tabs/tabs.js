(function() {
  'use strict';

  angular.module('base.tabs', ['base.core'])
    .controller('baTabsController', baTabsController)
    .directive('baTabs', baTabs)
    .directive('baTabContent', baTabContent)
    .directive('baTab', baTab)
    .directive('baTabIndividual', baTabIndividual)
    .directive('baTabHref', baTabHref)
    .directive('baTabCustom', baTabCustom)
    .directive('baTabContentCustom', baTabContentCustom)
    .service('BaseAppsTabs', BaseAppsTabs)
  ;

  BaseAppsTabs.$inject = ['BaseAppsApi'];

  function BaseAppsTabs(BaseAppsApi) {
    var service    = {};

    service.activate = activate;

    return service;

    //target should be element ID
    function activate(target) {
      BaseAppsApi.publish(target, 'show');
    }

  }

  baTabsController.$inject = ['$scope', 'BaseAppsApi'];

  function baTabsController($scope, BaseAppsApi) {
    var controller  = this;
    var tabs        = controller.tabs = $scope.tabs = [];
    var id          = '';
    var autoOpen    = true;
    var collapsible = false;

    controller.select = function(selectTab) {
      tabs.forEach(function(tab) {
        if(tab.scope === selectTab) {
          if (collapsible) {
            tab.active = !tab.active;
            tab.scope.active = !tab.scope.active;
          } else {
            tab.active = true;
            tab.scope.active = true;
          }

          if (tab.active) {
            BaseAppsApi.publish(id, ['activate', tab.scope.id]);
          } else {
            BaseAppsApi.publish(id, ['deactivate', tab.scope.id]);
          }
        } else {
          tab.active = false;
          tab.scope.active = false;
        }
      });
    };

    controller.addTab = function addTab(tabScope) {
      tabs.push({ scope: tabScope, active: false, parentContent: controller.id });

      if(tabs.length === 1 && autoOpen) {
        tabs[0].active = true;
        tabScope.active = true;
      }
    };

    controller.getId = function() {
      return id;
    };

    controller.setId = function(newId) {
      id = newId;
    };

    controller.setAutoOpen = function(val) {
      autoOpen = val;
    };

    controller.setCollapsible = function(val) {
      collapsible = val;
    };
  }

  baTabs.$inject = ['BaseAppsApi'];

  function baTabs(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      replace: true,
      templateUrl: 'components/tabs/tabs.html',
      controller: 'baTabsController',
      scope: {
        displaced: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.id = attrs.id || BaseAppsApi.generateUuid();
      scope.showTabContent = scope.displaced !== 'true';
      attrs.$set('id', scope.id);
      controller.setId(scope.id);
      controller.setAutoOpen(attrs.autoOpen !== "false");
      controller.setCollapsible(attrs.collapsible === "true");

      //update tabs in case tab-content doesn't have them
      var updateTabs = function() {
        BaseAppsApi.publish(scope.id + '-tabs', scope.tabs);
      };

      BaseAppsApi.subscribe(scope.id + '-get-tabs', function() {
        updateTabs();
      });

      scope.$on("$destroy", function() {
        BaseAppsApi.unsubscribe(scope.id + '-get-tabs');
      });
    }
  }

  baTabContent.$inject = ['BaseAppsApi'];

  function baTabContent(BaseAppsApi) {
    var directive = {
      restrict: 'A',
      transclude: 'true',
      replace: true,
      scope: {
        tabs: '=?',
        target: '@'
      },
      templateUrl: 'components/tabs/tab-content.html',
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.tabs = scope.tabs || [];
      var id = scope.target;

      BaseAppsApi.subscribe(id, function(msg) {
        if(msg[0] === 'activate') {
          scope.tabs.forEach(function (tab) {
            tab.scope.active = false;
            tab.active = false;

            if(tab.scope.id == msg[1]) {
              tab.scope.active = true;
              tab.active = true;
            }
          });
        } else if (msg[0] === 'deactivate') {
          scope.tabs.forEach(function (tab) {
            tab.scope.active = false;
            tab.active = false;
          });
        }
      });

      //if tabs empty, request tabs
      if(scope.tabs.length === 0) {
        BaseAppsApi.subscribe(id + '-tabs', function(tabs) {
          scope.tabs = tabs;
        });

        BaseAppsApi.publish(id + '-get-tabs', '');
      }

      scope.$on("$destroy", function() {
        BaseAppsApi.unsubscribe(id);
        BaseAppsApi.unsubscribe(id + '-tabs');
      });
    }
  }

  baTab.$inject = ['BaseAppsApi'];

  function baTab(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/tabs/tab.html',
      transclude: true,
      scope: {
        title: '@'
      },
      require: '^baTabs',
      replace: true,
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      scope.id = attrs.id || BaseAppsApi.generateUuid();
      scope.active = false;
      scope.transcludeFn = transclude;
      controller.addTab(scope);

      BaseAppsApi.subscribe(scope.id, function(msg) {
        if(msg === 'show' || msg === 'open' || msg === 'activate') {
          if (!scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'hide' || msg === 'close' || msg === 'deactivate') {
          if (scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'toggle') {
          controller.select(scope);
        }
      });

      scope.makeActive = function() {
        controller.select(scope);
      };

      scope.$on("$destroy", function() {
        BaseAppsApi.unsubscribe(scope.id);
      });
    }
  }

  baTabIndividual.$inject = ['BaseAppsApi'];

  function baTabIndividual(BaseAppsApi) {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      var tab = scope.$eval(attrs.tab);
      var id = tab.scope.id;

      tab.scope.transcludeFn(tab.scope, function(tabContent) {
        element.append(tabContent);
      });

      BaseAppsApi.subscribe(tab.scope.id, function(msg) {
        BaseAppsApi.publish(tab.parentContent, ['activate', tab.scope.id]);
        scope.$apply();
      });

      scope.$on("$destroy", function() {
        BaseAppsApi.unsubscribe(tab.scope.id);
      });
    }
  }

  //custom tabs

  baTabHref.$inject = ['BaseAppsApi'];

  function baTabHref(BaseAppsApi) {
    var directive = {
      restrict: 'A',
      replace: false,
      link: link
    }

    return directive;

    function link(scope, element, attrs, controller) {
      var target = attrs.baTabHref;

      BaseAppsApi.subscribe(target, function(msg) {
        if(msg === 'activate' || msg === 'show' || msg === 'open') {
          makeActive();
        }
      });


      element.on('click', function(e) {
        BaseAppsApi.publish(target, 'activate');
        makeActive();
        e.preventDefault();
      });

      function makeActive() {
        element.parent().children().removeClass('is-active');
        element.addClass('is-active');
      }
    }
  }

  baTabCustom.$inject = ['BaseAppsApi'];

  function baTabCustom(BaseAppsApi) {
    var directive = {
      restrict: 'A',
      replace: false,
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      var children = element.children();
      angular.element(children[0]).addClass('is-active');
    }
  }

  baTabContentCustom.$inject = ['BaseAppsApi'];

  function baTabContentCustom(BaseAppsApi) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element, attrs) {
      var tabs = [];
      var children = element.children();

      angular.forEach(children, function(node) {
        if(node.id) {
          var tabId = node.id;
          tabs.push(tabId);
          BaseAppsApi.subscribe(tabId, function(msg) {
            if(msg === 'activate' || msg === 'show' || msg === 'open') {
              activateTabs(tabId);
            }
          });

          if(tabs.length === 1) {
            var el = angular.element(node);
            el.addClass('is-active');
          }
        }
      });

      function activateTabs(tabId) {
        var tabNodes = element.children();
        angular.forEach(tabNodes, function(node) {
          var el = angular.element(node);
          el.removeClass('is-active');
          if(el.attr('id') === tabId) {
            el.addClass('is-active');
          }
        });
      }
    }
  }

})();
