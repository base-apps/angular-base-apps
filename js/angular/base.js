(function() {
  'use strict';

  // imports all components and dependencies under a single namespace

  angular.module('foundation', [
    'foundation.core',
    'foundation.mediaquery',
    'foundation.accordion',
    'foundation.actionsheet',
    'foundation.common',
    'foundation.iconic',
    'foundation.interchange',
    'foundation.modal',
    'foundation.notification',
    'foundation.offcanvas',
    'foundation.panel',
    'foundation.popup',
    'foundation.tabs'
  ]);

  angular.module('base', [
    'base.core',
    'base.mediaquery',
    'base.accordion',
    'base.actionsheet',
    'base.common',
    'base.iconic',
    'base.interchange',
    'base.modal',
    'base.notification',
    'base.offcanvas',
    'base.panel',
    'base.popup',
    'base.tabs'
  ]);


})();
