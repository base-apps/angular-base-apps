(function() {
  'use strict';
  
  angular.module('base.common', ['base.core'])
    .directive('baClose', baClose)
    .directive('baOpen', baOpen)
    .directive('baToggle', baToggle)
    .directive('baEscClose', baEscClose)
    .directive('baSwipeClose', baSwipeClose)
    .directive('baHardToggle', baHardToggle)
    .directive('baCloseAll', baCloseAll)
  ;

  baClose.$inject = ['FoundationApi'];

  function baClose(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      var targetId = '';
      if (attrs.baClose) {
        targetId = attrs.baClose;
      } else {
        var parentElement= false;
        var tempElement = element.parent();
        //find parent modal
        while(parentElement === false) {
          if(tempElement[0].nodeName == 'BODY') {
            parentElement = '';
          }

          if(typeof tempElement.attr('ba-closable') !== 'undefined' && tempElement.attr('ba-closable') !== false) {
            parentElement = tempElement;
          }

          tempElement = tempElement.parent();
        }
        targetId = parentElement.attr('id');
      }
      element.on('click', function(e) {
        foundationApi.publish(targetId, 'close');
        e.preventDefault();
      });
    }
  }

  baOpen.$inject = ['FoundationApi'];

  function baOpen(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        foundationApi.publish(attrs.baOpen, 'open');
        e.preventDefault();
      });
    }
  }

  baToggle.$inject = ['FoundationApi'];

  function baToggle(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    }

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        foundationApi.publish(attrs.baToggle, 'toggle');
        e.preventDefault();
      });
    }
  }

  baEscClose.$inject = ['FoundationApi'];

  function baEscClose(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('keyup', function(e) {
        if (e.keyCode === 27) {
          foundationApi.closeActiveElements();
        }
        e.preventDefault();
      });
    }
  }

  baSwipeClose.$inject = ['FoundationApi'];

  function baSwipeClose(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };
    return directive;

    function link($scope, element, attrs) {
      var swipeDirection;
      var hammerElem;
      if (typeof(Hammer)!=='undefined') {
        hammerElem = new Hammer(element[0]);
        // set the options for swipe (to make them a bit more forgiving in detection)
        hammerElem.get('swipe').set({
          direction: Hammer.DIRECTION_ALL,
          threshold: 5, // this is how far the swipe has to travel
          velocity: 0.5 // and this is how fast the swipe must travel
        });
      }
      // detect what direction the directive is pointing
      switch (attrs.baSwipeClose) {
        case 'right':
          swipeDirection = 'swiperight';
          break;
        case 'left':
          swipeDirection = 'swipeleft';
          break;
        case 'up':
          swipeDirection = 'swipeup';
          break;
        case 'down':
          swipeDirection = 'swipedown';
          break;
        default:
          swipeDirection = 'swipe';
      }
      if(typeof(hammerElem) !== 'undefined'){
        hammerElem.on(swipeDirection, function() {
          foundationApi.publish(attrs.id, 'close');
        });
      }
    }
  }

  baHardToggle.$inject = ['FoundationApi'];

  function baHardToggle(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        foundationApi.closeActiveElements({exclude: attrs.baHardToggle});
        foundationApi.publish(attrs.baHardToggle, 'toggle');
        e.preventDefault();
      });
    }
  }

  baCloseAll.$inject = ['FoundationApi'];

  function baCloseAll(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        var tar = e.target, avoid, activeElements, closedElements, i;

        // check if clicked target is designated to open/close another component
        avoid = ['ba-toggle', 'ba-hard-toggle', 'ba-open', 'ba-close'].filter(function(e){
          return e in tar.attributes;
        });
        if(avoid.length > 0) {
          // do nothing
          return;
        }

        // check if clicked element is inside active closable parent
        if (getParentsUntil(tar, 'ba-closable') !== false) {
          // do nothing
          return;
        }

        // close all active elements
        activeElements = document.querySelectorAll('.is-active[ba-closable]');
        closedElements = 0;
        if(activeElements.length > 0) {
          for(i = 0; i < activeElements.length; i++) {
            if (!activeElements[i].hasAttribute('ba-ignore-all-close')) {
              foundationApi.publish(activeElements[i].id, 'close');
              closedElements++;
            }
          }

          // if one or more elements were closed,
          // prevent the default action
          if (closedElements > 0) {
            e.preventDefault();
          }
        }
      });
    }
    /** special thanks to Chris Ferdinandi for this solution.
     * http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
     */
    function getParentsUntil(elem, parent) {
      for ( ; elem && elem !== document.body; elem = elem.parentNode ) {
        if(elem.hasAttribute(parent)){
          if(elem.classList.contains('is-active')){ return elem; }
          break;
        }
      }
      return false;
    }
  }
})();
