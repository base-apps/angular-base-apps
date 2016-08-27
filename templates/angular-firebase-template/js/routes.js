
  angular.module('dynamicRouting').config([
    '$BaseAppsStateProvider',
    function(BaseAppsStateProvider) {
      BaseAppsStateProvider.registerDynamicRoutes([{"name":"home","url":"/","controller":"HomeController","path":"home.html"}]);
    }
  ]);
  