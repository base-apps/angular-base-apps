(function() {
  'use strict';

  angular.module('base.interchange', ['base.core', 'base.mediaquery'])
    .directive('baInterchange', baInterchange)
    /*
     * Final directive to perform media queries, other directives set up this one
     * (See: http://stackoverflow.com/questions/19224028/add-directives-from-directive-in-angularjs)
     */
    .directive('baQuery', baQuery)
    /*
     * ba-if / ba-show / ba-hide
     */
    .directive('baIf', baQueryDirective('ng-if', 'ba-if'))
    .directive('baShow', baQueryDirective('ng-show', 'ba-show'))
    .directive('baHide', baQueryDirective('ng-hide', 'ba-hide'))
  ;

  baInterchange.$inject = [ '$compile', '$http', '$templateCache', 'BaseAppsApi', 'BaseAppsMediaQuery'];

  function baInterchange($compile, $http, $templateCache, BaseAppsApi, BaseAppsMediaQuery) {

    var directive = {
      restrict: 'EA',
      transclude: 'element',
      scope: {
        position: '@'
      },
      replace: true,
      template: '<div></div>',
      link: link
    };

    return directive;

    function link(scope, element, attrs, ctrl, transclude) {
      var childScope, current, scenarios, innerTemplates;

      var globalQueries = BaseAppsMediaQuery.getMediaQueries();

      // subscribe for resize events
      BaseAppsApi.subscribe('resize', resize);

      scope.$on("$destroy", function() {
        BaseAppsApi.unsubscribe('resize', resize);
      });

      //init
      BaseAppsApi.publish('resize', 'initial resize');

      function templateLoader(templateUrl) {
        return $http.get(templateUrl, {cache: $templateCache});
      }

      function collectInformation(el) {
        var data = BaseAppsMediaQuery.collectScenariosFromElement(el);

        scenarios = data.scenarios;
        innerTemplates = data.templates;
      }

      function checkScenario(scenario) {
        return !current || current !== scenario;
      }

      function resize(msg) {
        transclude(function(clone, newScope) {
          if(!scenarios || !innerTemplates) {
            collectInformation(clone);
          }

          var ruleMatches = BaseAppsMediaQuery.match(scenarios);
          var scenario = ruleMatches.length === 0 ? null : scenarios[ruleMatches[0].ind];

          //this could use some love
          if(scenario && checkScenario(scenario)) {
            var compiled;

            if(childScope) {
              childScope.$destroy();
              childScope = null;
            }

            if(typeof scenario.templ !== 'undefined') {
              childScope = newScope;

              //temp container
              var tmp = document.createElement('div');
              tmp.appendChild(innerTemplates[scenario.templ][0]);

              element.html(tmp.innerHTML);
              $compile(element.contents())(childScope);
              current = scenario;
            } else {
              var loader = templateLoader(scenario.src);
              loader.success(function(html) {
                childScope = newScope;
                element.html(html);
              }).then(function(){
                $compile(element.contents())(childScope);
                current = scenario;
              });
            }
          }
        });
      }
    }
  }

  /*
   * This directive will configure ng-if/ng-show/ng-hide and ba-query directives and then recompile the element
   */
  function baQueryDirective(angularDirective, directiveName) {
    return ['$compile', 'BaseAppsApi', function ($compile, BaseAppsApi) {
      // create unique scope property for media query result, must be unique to avoid collision with other ba-query directives
      // property set upon element compilation or else all similar directives (i.e. ba-if-*/ba-show-*/ba-hide-*) will get the same value
      var queryResult;

      return {
        priority: 1000, // must compile directive before any others
        terminal: true, // don't compile any other directive after this
                        // we'll fix this with a recompile
        restrict: 'A',
        compile: compile
      };

      // From here onward, scope[queryResult] refers to the result of running the provided query
      function compile(element, attrs) {
        var previousParam;

        // set unique property
        queryResult = (directiveName + BaseAppsApi.generateUuid()).replace(/-/g,'');

        // set default configuration
        element.attr('ba-query-not', false);
        element.attr('ba-query-only', false);
        element.attr('ba-query-or-smaller', false);
        element.attr('ba-query-scope-prop', queryResult);

        // parse directive attribute for query parameters
        element.attr(directiveName).split(' ').forEach(function(param) {
          if (param) {
            // add ba-query directive and configuration attributes
            switch (param) {
              case "not":
                element.attr('ba-query-not', true);
                element.attr('ba-query-only', true);
                break;
              case "only":
                element.attr('ba-query-only', true);
                break;
              case "or":
                break;
              case "smaller":
                // allow usage of smaller keyword if preceeded by 'or' keyword
                if (previousParam === "or") {
                  element.attr('ba-query-or-smaller', true);
                }
                break;
              default:
                element.attr('ba-query', param);
                break;
            }

            previousParam = param;
          }
        });

        // add/update angular directive
        if (!element.attr(angularDirective)) {
          element.attr(angularDirective, queryResult);
        } else {
          element.attr(angularDirective, queryResult + ' && (' + element.attr(angularDirective) + ')');
        }

        // remove directive from current element to avoid infinite recompile
        element.removeAttr(directiveName);
        element.removeAttr('data-' + directiveName);

        return {
          pre: function (scope, element, attrs) {
          },
          post: function (scope, element, attrs) {
            // recompile
            $compile(element)(scope);
          }
        };
      }
    }];
  }

  baQuery.$inject = ['BaseAppsApi', 'BaseAppsMediaQuery'];
  function baQuery(BaseAppsApi, BaseAppsMediaQuery) {
    return {
      priority: 601, // must compile before ng-if (600)
      restrict: 'A',
      compile: function compile(element, attrs) {
        return compileWrapper(attrs['baQueryScopeProp'],
                              attrs['baQuery'],
                              attrs['baQueryOnly'] === "true",
                              attrs['baQueryNot'] === "true",
                              attrs['baQueryOrSmaller'] === "true");
      }
    };

    // parameters will be populated with values provided from ba-query-* attributes
    function compileWrapper(queryResult, namedQuery, queryOnly, queryNot, queryOrSmaller) {
      // set defaults
      queryOnly = queryOnly || false;
      queryNot = queryNot || false;

      return {
        pre: preLink,
        post: postLink
      };

      // From here onward, scope[queryResult] refers to the result of running the provided query
      function preLink(scope, element, attrs) {
        // initially set media query result to false
        scope[queryResult] = false;
      }

      function postLink(scope, element, attrs) {
        // subscribe for resize events
        BaseAppsApi.subscribe('resize', resize);

        scope.$on("$destroy", function() {
          BaseAppsApi.unsubscribe('resize', resize);
        });

        // run first media query check
        runQuery();

        function runQuery() {
          if (!queryOnly) {
            if (!queryOrSmaller) {
              // Check if matches media or LARGER
              scope[queryResult] = BaseAppsMediaQuery.matchesMedia(namedQuery);
            } else {
              // Check if matches media or SMALLER
              scope[queryResult] = BaseAppsMediaQuery.matchesMediaOrSmaller(namedQuery);
            }
          } else {
            if (!queryNot) {
              // Check that media ONLY matches named query and nothing else
              scope[queryResult] = BaseAppsMediaQuery.matchesMediaOnly(namedQuery);
            } else {
              // Check that media does NOT match named query
              scope[queryResult] = !BaseAppsMediaQuery.matchesMediaOnly(namedQuery);
            }
          }
        }

        function resize() {
          var orignalVisibilty = scope[queryResult];
          runQuery();
          if (orignalVisibilty != scope[queryResult]) {
            // digest if visibility changed
            scope.$digest();
          }
        }
      }
    }
  }
})();
