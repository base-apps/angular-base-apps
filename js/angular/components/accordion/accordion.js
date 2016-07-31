(function() {
  'use strict';

  angular.module('foundation.accordion', [])
    .controller('ZfAccordionController', zfAccordionController)
    .directive('zfAccordion', zfAccordion)
    .directive('zfAccordionItem', zfAccordionItem)
  ;


  angular.module('base.accordion', [])
    .controller('ZfAccordionController', zfAccordionController)
    .directive('zfAccordion', zfAccordion)
    .directive('zfAccordionItem', zfAccordionItem)
  ;

  zfAccordionController.$inject = ['$scope'];

  function zfAccordionController($scope) {
    var controller = this;
    var sections = controller.sections = $scope.sections = [];
    var multiOpen   = false;
    var collapsible = false;
    var autoOpen    = true;

    controller.select = function(selectSection) {
      sections.forEach(function(section) {
        if(section.scope === selectSection) {
          if (multiOpen || collapsible) {
            section.scope.active = !section.scope.active;
          } else {
            section.scope.active = true;
          }
        } else {
          if (!multiOpen) {
            section.scope.active = false;
          }
        }
      });
    };

    controller.addSection = function addsection(sectionScope) {
      sections.push({ scope: sectionScope });

      if(sections.length === 1 && autoOpen === true) {
        sections[0].active = true;
        sections[0].scope.active = true;
      }
    };

    controller.closeAll = function() {
      sections.forEach(function(section) {
        section.scope.active = false;
      });
    };

    controller.setAutoOpen = function(val) {
      autoOpen = val;
    };

    controller.setCollapsible = function(val) {
      collapsible = val;
    };

    controller.setMultiOpen = function(val) {
      multiOpen = val;
    };
  }

  function zfAccordion() {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      replace: true,
      templateUrl: 'components/accordion/accordion.html',
      controller: 'ZfAccordionController',
      scope: {
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      controller.setAutoOpen(attrs.autoOpen !== "false");
      controller.setCollapsible(attrs.collapsible === "true");
      controller.setMultiOpen(attrs.multiOpen === "true");
    }
  }

  //accordion item
  zfAccordionItem.$inject = ['FoundationApi'];

  function zfAccordionItem(foundationApi) {
    var directive = {
        restrict: 'EA',
        templateUrl: 'components/accordion/accordion-item.html',
        transclude: true,
        scope: {
          title: '@'
        },
        require: '^zfAccordion',
        replace: true,
        controller: function() {},
        link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      scope.id = attrs.id || foundationApi.generateUuid();
      scope.active = false;
      controller.addSection(scope);

      foundationApi.subscribe(scope.id, function(msg) {
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

        scope.$digest();
      });

      scope.activate = function() {
        controller.select(scope);
      };

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(scope.id);
      });
    }
  }

})();
