(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("app.js", function(exports, require, module) {
'use strict';

var _fastclick = require('fastclick');

var _fastclick2 = _interopRequireDefault(_fastclick);

var _angular = require('angular');

var _angular2 = _interopRequireDefault(_angular);

require('angular-base-apps');

require('firebase');

require('angularfire');

var _configFirebase = require('./config/config-firebase');

var _configFirebase2 = _interopRequireDefault(_configFirebase);

require('angular-icons/dist/open-iconic');

require('angular-icons/dist/ionicons');

require('angular-icons/dist/material-icons');

require('angular-dynamic-routing/dynamicRouting');

require('angular-dynamic-routing/dynamicRouting.animations');

require('./config/config-routes');

require('./modules');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Angular Base Apps Configuration
firebase.initializeApp(_configFirebase2.default);

// Icon Configuration


// Firebase Configuration


// Route Configuration


// Module Configuration


// Application Configuration
var AppConfig = function AppConfig($urlProvider, $locationProvider, $firebaseRefProvider) {
  $urlProvider.otherwise('/');

  $locationProvider.html5Mode({
    enabled: false,
    requireBase: false
  });

  $firebaseRefProvider.registerUrl(_configFirebase2.default.databaseURL);
};

AppConfig.$inject = ['$urlRouterProvider', '$locationProvider', '$firebaseRefProvider'];

var AppRun = function AppRun() {
  _fastclick2.default.FastClick.attach(document.body);
};

_angular2.default.module('application', ['ui.router', 'ngAnimate',

// firebase
'firebase',

// base apps
'base',

// icons
'angularIcons.openIconic', 'angularIcons.ionicons', 'angularIcons.materialIcons',

// dynamic routing
'dynamicRouting', 'dynamicRouting.animations',

// modules
'application.home']).config(AppConfig).run(AppRun);
});

require.register("config/config-firebase.js", function(exports, require, module) {
'use strict';

module.exports = {
  apiKey: 'AIzaSyBkB1IvviOcPq4z8Rs7nijEdIa9n1IvRlU',
  authDomain: 'angular-firebase-template.firebaseapp.com',
  databaseURL: 'https://angular-firebase-template.firebaseio.com',
  storageBucket: ''
};
});

require.register("config/config-routes.js", function(exports, require, module) {
'use strict';

angular.module('dynamicRouting').config(['$BaseAppsStateProvider', function (BaseAppsStateProvider) {
  BaseAppsStateProvider.registerDynamicRoutes([{ "name": "home", "url": "/", "controller": "HomeController as home", "path": "modules/home/home.html" }]);
}]);
});

require.register("modules/home/home-controller.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HomeController = function () {
  function HomeController($firebaseRef, $firebaseObject, $firebaseArray) {
    _classCallCheck(this, HomeController);

    var vm = this,
        ref;

    ref = $firebaseRef.default.child('person');
    this.person = $firebaseObject(ref);
    ref = $firebaseRef.default.child('messages');
    this.messages = $firebaseArray(ref);

    this.messages.$resolved = false;
    this.messages.$loaded().then(function () {
      vm.messages.$resolved = true;
    });

    return vm;
  }

  _createClass(HomeController, [{
    key: 'submitMessage',
    value: function submitMessage(message) {
      this.messages.$add(message);
    }
  }, {
    key: 'updateName',
    value: function updateName(name) {
      this.person.name = name;
      this.person.$save();
    }
  }]);

  return HomeController;
}();

exports.default = HomeController;


HomeController.$inject = ['$firebaseRef', '$firebaseObject', '$firebaseArray'];
});

require.register("modules/home/index.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('firebase');

var _homeController = require('./home-controller');

var _homeController2 = _interopRequireDefault(_homeController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = angular.module('application.home', ['firebase']).controller('HomeController', _homeController2.default).name;
});

require.register("modules/index.js", function(exports, require, module) {
'use strict';

require('./home');
});

require.alias("brunch/node_modules/deppack/node_modules/node-browser-modules/node_modules/path-browserify/index.js", "path");
require.alias("brunch/node_modules/deppack/node_modules/node-browser-modules/node_modules/process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map