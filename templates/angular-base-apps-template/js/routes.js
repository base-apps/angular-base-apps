
  angular.module('dynamicRouting').config([
    '$BaseAppsStateProvider',
    function(BaseAppsStateProvider) {
      BaseAppsStateProvider.registerDynamicRoutes([{"name":"home","url":"/","path":"home.html"}]);
    }
  ]);
  