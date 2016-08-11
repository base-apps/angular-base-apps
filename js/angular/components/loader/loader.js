(function() {
  'use strict';

  angular.module('base.loader', [])
    .directive('abSpinKit', abSpinKit)
  ;

  function abSpinKit() {
    var directive = {
      restrict: 'EA',
      replace: true,
      templateUrl: function(element, attrs) {
        return "components/loader/spinkit-" + (attrs.loader || "rotating-plane") + ".html";
      }
    };

    return directive;
  }
})();
