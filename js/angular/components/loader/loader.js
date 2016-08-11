(function() {
  'use strict';

  angular.module('base.loader', [])
    .directive('baSpinKit', baSpinKit)
  ;

  function baSpinKit() {
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
