"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function testWebP(callback) {
  var webP = new Image();

  webP.onload = webP.onerror = function () {
    callback(webP.height == 2);
  };

  webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
}

testWebP(function (support) {
  if (support == true) {
    document.querySelector('body').classList.add('webp');
  } else {
    document.querySelector('body').classList.add('no-webp');
  }
});
/**
* jquery.matchHeight.js master
* http://brm.io/jquery-match-height/
* License: MIT
*/

;

(function (factory) {
  // eslint-disable-line no-extra-semi
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Global
    factory(jQuery);
  }
})(function ($) {
  /*
  *  internal
  */
  var _previousResizeWidth = -1,
      _updateTimeout = -1;
  /*
  *  _parse
  *  value parse utility function
  */


  var _parse = function _parse(value) {
    // parse value and convert NaN to 0
    return parseFloat(value) || 0;
  };
  /*
  *  _rows
  *  utility function returns array of jQuery selections representing each row
  *  (as displayed after float wrapping applied by browser)
  */


  var _rows = function _rows(elements) {
    var tolerance = 1,
        $elements = $(elements),
        lastTop = null,
        rows = []; // group elements by their top position

    $elements.each(function () {
      var $that = $(this),
          top = $that.offset().top - _parse($that.css('margin-top')),
          lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

      if (lastRow === null) {
        // first item on the row, so just push it
        rows.push($that);
      } else {
        // if the row top is the same, add to the row group
        if (Math.floor(Math.abs(lastTop - top)) <= tolerance) {
          rows[rows.length - 1] = lastRow.add($that);
        } else {
          // otherwise start a new row group
          rows.push($that);
        }
      } // keep track of the last row top


      lastTop = top;
    });
    return rows;
  };
  /*
  *  _parseOptions
  *  handle plugin options
  */


  var _parseOptions = function _parseOptions(options) {
    var opts = {
      byRow: true,
      property: 'height',
      target: null,
      remove: false
    };

    if (_typeof(options) === 'object') {
      return $.extend(opts, options);
    }

    if (typeof options === 'boolean') {
      opts.byRow = options;
    } else if (options === 'remove') {
      opts.remove = true;
    }

    return opts;
  };
  /*
  *  matchHeight
  *  plugin definition
  */


  var matchHeight = $.fn.matchHeight = function (options) {
    var opts = _parseOptions(options); // handle remove


    if (opts.remove) {
      var that = this; // remove fixed height from all selected elements

      this.css(opts.property, ''); // remove selected elements from all groups

      $.each(matchHeight._groups, function (key, group) {
        group.elements = group.elements.not(that);
      }); // TODO: cleanup empty groups

      return this;
    }

    if (this.length <= 1 && !opts.target) {
      return this;
    } // keep track of this group so we can re-apply later on load and resize events


    matchHeight._groups.push({
      elements: this,
      options: opts
    }); // match each element's height to the tallest element in the selection


    matchHeight._apply(this, opts);

    return this;
  };
  /*
  *  plugin global options
  */


  matchHeight.version = 'master';
  matchHeight._groups = [];
  matchHeight._throttle = 80;
  matchHeight._maintainScroll = false;
  matchHeight._beforeUpdate = null;
  matchHeight._afterUpdate = null;
  matchHeight._rows = _rows;
  matchHeight._parse = _parse;
  matchHeight._parseOptions = _parseOptions;
  /*
  *  matchHeight._apply
  *  apply matchHeight to given elements
  */

  matchHeight._apply = function (elements, options) {
    var opts = _parseOptions(options),
        $elements = $(elements),
        rows = [$elements]; // take note of scroll position


    var scrollTop = $(window).scrollTop(),
        htmlHeight = $('html').outerHeight(true); // get hidden parents

    var $hiddenParents = $elements.parents().filter(':hidden'); // cache the original inline style

    $hiddenParents.each(function () {
      var $that = $(this);
      $that.data('style-cache', $that.attr('style'));
    }); // temporarily must force hidden parents visible

    $hiddenParents.css('display', 'block'); // get rows if using byRow, otherwise assume one row

    if (opts.byRow && !opts.target) {
      // must first force an arbitrary equal height so floating elements break evenly
      $elements.each(function () {
        var $that = $(this),
            display = $that.css('display'); // temporarily force a usable display value

        if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
          display = 'block';
        } // cache the original inline style


        $that.data('style-cache', $that.attr('style'));
        $that.css({
          'display': display,
          'padding-top': '0',
          'padding-bottom': '0',
          'margin-top': '0',
          'margin-bottom': '0',
          'border-top-width': '0',
          'border-bottom-width': '0',
          'height': '100px',
          'overflow': 'hidden'
        });
      }); // get the array of rows (based on element top position)

      rows = _rows($elements); // revert original inline styles

      $elements.each(function () {
        var $that = $(this);
        $that.attr('style', $that.data('style-cache') || '');
      });
    }

    $.each(rows, function (key, row) {
      var $row = $(row),
          targetHeight = 0;

      if (!opts.target) {
        // skip apply to rows with only one item
        if (opts.byRow && $row.length <= 1) {
          $row.css(opts.property, '');
          return;
        } // iterate the row and find the max height


        $row.each(function () {
          var $that = $(this),
              display = $that.css('display'); // temporarily force a usable display value

          if (display !== 'inline-block' && display !== 'flex' && display !== 'inline-flex') {
            display = 'block';
          } // ensure we get the correct actual height (and not a previously set height value)


          var css = {
            'display': display
          };
          css[opts.property] = '';
          $that.css(css); // find the max height (including padding, but not margin)

          if ($that.outerHeight(false) > targetHeight) {
            targetHeight = $that.outerHeight(false);
          } // revert display block


          $that.css('display', '');
        });
      } else {
        // if target set, use the height of the target element
        targetHeight = opts.target.outerHeight(false);
      } // iterate the row and apply the height to all elements


      $row.each(function () {
        var $that = $(this),
            verticalPadding = 0; // don't apply to a target

        if (opts.target && $that.is(opts.target)) {
          return;
        } // handle padding and border correctly (required when not using border-box)


        if ($that.css('box-sizing') !== 'border-box') {
          verticalPadding += _parse($that.css('border-top-width')) + _parse($that.css('border-bottom-width'));
          verticalPadding += _parse($that.css('padding-top')) + _parse($that.css('padding-bottom'));
        } // set the height (accounting for padding and border)


        $that.css(opts.property, targetHeight - verticalPadding + 'px');
      });
    }); // revert hidden parents

    $hiddenParents.each(function () {
      var $that = $(this);
      $that.attr('style', $that.data('style-cache') || null);
    }); // restore scroll position if enabled

    if (matchHeight._maintainScroll) {
      $(window).scrollTop(scrollTop / htmlHeight * $('html').outerHeight(true));
    }

    return this;
  };
  /*
  *  matchHeight._applyDataApi
  *  applies matchHeight to all elements with a data-match-height attribute
  */


  matchHeight._applyDataApi = function () {
    var groups = {}; // generate groups by their groupId set by elements using data-match-height

    $('[data-match-height], [data-mh]').each(function () {
      var $this = $(this),
          groupId = $this.attr('data-mh') || $this.attr('data-match-height');

      if (groupId in groups) {
        groups[groupId] = groups[groupId].add($this);
      } else {
        groups[groupId] = $this;
      }
    }); // apply matchHeight to each group

    $.each(groups, function () {
      this.matchHeight(true);
    });
  };
  /*
  *  matchHeight._update
  *  updates matchHeight on all current groups with their correct options
  */


  var _update = function _update(event) {
    if (matchHeight._beforeUpdate) {
      matchHeight._beforeUpdate(event, matchHeight._groups);
    }

    $.each(matchHeight._groups, function () {
      matchHeight._apply(this.elements, this.options);
    });

    if (matchHeight._afterUpdate) {
      matchHeight._afterUpdate(event, matchHeight._groups);
    }
  };

  matchHeight._update = function (throttle, event) {
    // prevent update if fired from a resize event
    // where the viewport width hasn't actually changed
    // fixes an event looping bug in IE8
    if (event && event.type === 'resize') {
      var windowWidth = $(window).width();

      if (windowWidth === _previousResizeWidth) {
        return;
      }

      _previousResizeWidth = windowWidth;
    } // throttle updates


    if (!throttle) {
      _update(event);
    } else if (_updateTimeout === -1) {
      _updateTimeout = setTimeout(function () {
        _update(event);

        _updateTimeout = -1;
      }, matchHeight._throttle);
    }
  };
  /*
  *  bind events
  */
  // apply on DOM ready event


  $(matchHeight._applyDataApi); // update heights on load and resize events

  $(window).bind('load', function (event) {
    matchHeight._update(false, event);
  }); // throttled update heights on resize events

  $(window).bind('resize orientationchange', function (event) {
    matchHeight._update(true, event);
  });
});
/*
* jQuery.appear
* http://code.google.com/p/jquery-appear/
*
* Copyright (c) 2009 Michael Hixson
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
*/


(function ($) {
  $.fn.appear = function (f, o) {
    var s = $.extend({
      one: true
    }, o);
    return this.each(function () {
      var t = $(this);
      t.appeared = false;

      if (!f) {
        t.trigger('appear', s.data);
        return;
      }

      var w = $(window);

      var c = function c() {
        if (!t.is(':visible')) {
          t.appeared = false;
          return;
        }

        var a = w.scrollLeft();
        var b = w.scrollTop();
        var o = t.offset();
        var x = o.left;
        var y = o.top;

        if (y + t.height() >= b && y <= b + w.height() && x + t.width() >= a && x <= a + w.width()) {
          if (!t.appeared) t.trigger('appear', s.data);
        } else {
          t.appeared = false;
        }
      };

      var m = function m() {
        t.appeared = true;

        if (s.one) {
          w.unbind('scroll', c);
          var i = $.inArray(c, $.fn.appear.checks);
          if (i >= 0) $.fn.appear.checks.splice(i, 1);
        }

        f.apply(this, arguments);
      };

      if (s.one) t.one('appear', s.data, m);else t.bind('appear', s.data, m);
      w.scroll(c);
      $.fn.appear.checks.push(c);
      c();
    });
  };

  $.extend($.fn.appear, {
    checks: [],
    timeout: null,
    checkAll: function checkAll() {
      var l = $.fn.appear.checks.length;
      if (l > 0) while (l--) {
        $.fn.appear.checks[l]();
      }
    },
    run: function run() {
      if ($.fn.appear.timeout) clearTimeout($.fn.appear.timeout);
      $.fn.appear.timeout = setTimeout($.fn.appear.checkAll, 20);
    }
  });
  $.each(['append', 'prepend', 'after', 'before', 'attr', 'removeAttr', 'addClass', 'removeClass', 'toggleClass', 'remove', 'css', 'show', 'hide'], function (i, n) {
    var u = $.fn[n];

    if (u) {
      $.fn[n] = function () {
        var r = u.apply(this, arguments);
        $.fn.appear.run();
        return r;
      };
    }
  });
})(jQuery);

$(document).ready(function () {
  "use strict"; //?????????????????? ?????????????? ???????????? ???????????? ???????? ???? ??????????

  document.oncontextmenu = cmenu;

  function cmenu() {
    return false;
  } //?????????????????? ?????????????????? ???????????? ?? ???????????????????? ???????????? Ctrl + A ?? Ctrl + U ?? Ctrl + S


  function preventSelection(element) {
    var preventSelection = false;

    function addHandler(element, event, handler) {
      if (element.attachEvent) element.attachEvent('on' + event, handler);else if (element.addEventListener) element.addEventListener(event, handler, false);
    }

    function removeSelection() {
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      } else if (document.selection && document.selection.clear) document.selection.clear();
    } //?????????????????? ???????????????? ?????????? ????????????


    addHandler(element, 'mousemove', function () {
      if (preventSelection) removeSelection();
    });
    addHandler(element, 'mousedown', function (event) {
      var event = event || window.event;
      var sender = event.target || event.srcElement;
      preventSelection = !sender.tagName.match(/INPUT|TEXTAREA/i);
    }); //?????????????????? ?????????????? ???????????? Ctrl + A ?? Ctrl + U ?? Ctrl + S

    function killCtrlA(event) {
      var event = event || window.event;
      var sender = event.target || event.srcElement;
      if (sender.tagName.match(/INPUT|TEXTAREA/i)) return;
      var key = event.keyCode || event.which;

      if (event.ctrlKey && key == 'U'.charCodeAt(0) || event.ctrlKey && key == 'A'.charCodeAt(0) || event.ctrlKey && key == 'S'.charCodeAt(0)) {
        removeSelection();
        if (event.preventDefault) event.preventDefault();else event.returnValue = false;
      }
    }

    addHandler(element, 'keydown', killCtrlA);
    addHandler(element, 'keyup', killCtrlA);
  }

  preventSelection(document);
}); // end $(document)
// DM Top

$(window).scroll(function () {
  if ($(this).scrollTop() > 1) {
    $('.dmtop').css({
      top: "100px"
    });
  } else {
    $('.dmtop').css({
      top: "-100px"
    });
  }
});
$('.dmtop').click(function () {
  $('html, body').animate({
    scrollTop: '0px'
  }, 800);
  return false;
});
/* ==========================================================================
   header scroll
   ========================================================================== */

$(window).scroll(function () {
  if ($(this).scrollTop() > 1) {
    $('#header').addClass('affix');
  } else {
    $('#header').removeClass('affix');
  }
});
$(document).ready(function () {
  "use strict";
  /* ==========================================================================
     URL
     ========================================================================== */

  $(function () {
    $('[name="url"]').val(window.location);
  }); /////////////////////////////////////////////////////////////////////////
  //Burger
  /////////////////////////////////////////////////////////////////////////

  $(".navbar__burger").click(function () {
    $(".navbar__nav").fadeToggle(300);
    $(".navbar__burger").toggleClass('open');
  }); /////////////////////////////////////////////////////////////////////////
  //Parallax
  /////////////////////////////////////////////////////////////////////////

  /*!
   * Stellar.js v0.6.2
   * http://markdalgleish.com/projects/stellar.js
   * 
   * Copyright 2013, Mark Dalgleish
   * This content is released under the MIT license
   * http://markdalgleish.mit-license.org
   */

  (function ($, window, document, undefined) {
    var pluginName = 'stellar',
        defaults = {
      scrollProperty: 'scroll',
      positionProperty: 'position',
      horizontalScrolling: true,
      verticalScrolling: true,
      horizontalOffset: 0,
      verticalOffset: 0,
      responsive: false,
      parallaxBackgrounds: true,
      parallaxElements: true,
      hideDistantElements: true,
      hideElement: function hideElement($elem) {
        $elem.hide();
      },
      showElement: function showElement($elem) {
        $elem.show();
      }
    },
        scrollProperty = {
      scroll: {
        getLeft: function getLeft($elem) {
          return $elem.scrollLeft();
        },
        setLeft: function setLeft($elem, val) {
          $elem.scrollLeft(val);
        },
        getTop: function getTop($elem) {
          return $elem.scrollTop();
        },
        setTop: function setTop($elem, val) {
          $elem.scrollTop(val);
        }
      },
      position: {
        getLeft: function getLeft($elem) {
          return parseInt($elem.css('left'), 10) * -1;
        },
        getTop: function getTop($elem) {
          return parseInt($elem.css('top'), 10) * -1;
        }
      },
      margin: {
        getLeft: function getLeft($elem) {
          return parseInt($elem.css('margin-left'), 10) * -1;
        },
        getTop: function getTop($elem) {
          return parseInt($elem.css('margin-top'), 10) * -1;
        }
      },
      transform: {
        getLeft: function getLeft($elem) {
          var computedTransform = getComputedStyle($elem[0])[prefixedTransform];
          return computedTransform !== 'none' ? parseInt(computedTransform.match(/(-?[0-9]+)/g)[4], 10) * -1 : 0;
        },
        getTop: function getTop($elem) {
          var computedTransform = getComputedStyle($elem[0])[prefixedTransform];
          return computedTransform !== 'none' ? parseInt(computedTransform.match(/(-?[0-9]+)/g)[5], 10) * -1 : 0;
        }
      }
    },
        positionProperty = {
      position: {
        setLeft: function setLeft($elem, left) {
          $elem.css('left', left);
        },
        setTop: function setTop($elem, top) {
          $elem.css('top', top);
        }
      },
      transform: {
        setPosition: function setPosition($elem, left, startingLeft, top, startingTop) {
          $elem[0].style[prefixedTransform] = 'translate3d(' + (left - startingLeft) + 'px, ' + (top - startingTop) + 'px, 0)';
        }
      }
    },
        // Returns a function which adds a vendor prefix to any CSS property name
    vendorPrefix = function () {
      var prefixes = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,
          style = $('script')[0].style,
          prefix = '',
          prop;

      for (prop in style) {
        if (prefixes.test(prop)) {
          prefix = prop.match(prefixes)[0];
          break;
        }
      }

      if ('WebkitOpacity' in style) {
        prefix = 'Webkit';
      }

      if ('KhtmlOpacity' in style) {
        prefix = 'Khtml';
      }

      return function (property) {
        return prefix + (prefix.length > 0 ? property.charAt(0).toUpperCase() + property.slice(1) : property);
      };
    }(),
        prefixedTransform = vendorPrefix('transform'),
        supportsBackgroundPositionXY = $('<div />', {
      style: 'background:#fff'
    }).css('background-position-x') !== undefined,
        setBackgroundPosition = supportsBackgroundPositionXY ? function ($elem, x, y) {
      $elem.css({
        'background-position-x': x,
        'background-position-y': y
      });
    } : function ($elem, x, y) {
      $elem.css('background-position', x + ' ' + y);
    },
        getBackgroundPosition = supportsBackgroundPositionXY ? function ($elem) {
      return [$elem.css('background-position-x'), $elem.css('background-position-y')];
    } : function ($elem) {
      return $elem.css('background-position').split(' ');
    },
        requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
      setTimeout(callback, 1000 / 60);
    };

    function Plugin(element, options) {
      this.element = element;
      this.options = $.extend({}, defaults, options);
      this._defaults = defaults;
      this._name = pluginName;
      this.init();
    }

    Plugin.prototype = {
      init: function init() {
        this.options.name = pluginName + '_' + Math.floor(Math.random() * 1e9);

        this._defineElements();

        this._defineGetters();

        this._defineSetters();

        this._handleWindowLoadAndResize();

        this._detectViewport();

        this.refresh({
          firstLoad: true
        });

        if (this.options.scrollProperty === 'scroll') {
          this._handleScrollEvent();
        } else {
          this._startAnimationLoop();
        }
      },
      _defineElements: function _defineElements() {
        if (this.element === document.body) this.element = window;
        this.$scrollElement = $(this.element);
        this.$element = this.element === window ? $('body') : this.$scrollElement;
        this.$viewportElement = this.options.viewportElement !== undefined ? $(this.options.viewportElement) : this.$scrollElement[0] === window || this.options.scrollProperty === 'scroll' ? this.$scrollElement : this.$scrollElement.parent();
      },
      _defineGetters: function _defineGetters() {
        var self = this,
            scrollPropertyAdapter = scrollProperty[self.options.scrollProperty];

        this._getScrollLeft = function () {
          return scrollPropertyAdapter.getLeft(self.$scrollElement);
        };

        this._getScrollTop = function () {
          return scrollPropertyAdapter.getTop(self.$scrollElement);
        };
      },
      _defineSetters: function _defineSetters() {
        var self = this,
            scrollPropertyAdapter = scrollProperty[self.options.scrollProperty],
            positionPropertyAdapter = positionProperty[self.options.positionProperty],
            setScrollLeft = scrollPropertyAdapter.setLeft,
            setScrollTop = scrollPropertyAdapter.setTop;
        this._setScrollLeft = typeof setScrollLeft === 'function' ? function (val) {
          setScrollLeft(self.$scrollElement, val);
        } : $.noop;
        this._setScrollTop = typeof setScrollTop === 'function' ? function (val) {
          setScrollTop(self.$scrollElement, val);
        } : $.noop;

        this._setPosition = positionPropertyAdapter.setPosition || function ($elem, left, startingLeft, top, startingTop) {
          if (self.options.horizontalScrolling) {
            positionPropertyAdapter.setLeft($elem, left, startingLeft);
          }

          if (self.options.verticalScrolling) {
            positionPropertyAdapter.setTop($elem, top, startingTop);
          }
        };
      },
      _handleWindowLoadAndResize: function _handleWindowLoadAndResize() {
        var self = this,
            $window = $(window);

        if (self.options.responsive) {
          $window.bind('load.' + this.name, function () {
            self.refresh();
          });
        }

        $window.bind('resize.' + this.name, function () {
          self._detectViewport();

          if (self.options.responsive) {
            self.refresh();
          }
        });
      },
      refresh: function refresh(options) {
        var self = this,
            oldLeft = self._getScrollLeft(),
            oldTop = self._getScrollTop();

        if (!options || !options.firstLoad) {
          this._reset();
        }

        this._setScrollLeft(0);

        this._setScrollTop(0);

        this._setOffsets();

        this._findParticles();

        this._findBackgrounds(); // Fix for WebKit background rendering bug


        if (options && options.firstLoad && /WebKit/.test(navigator.userAgent)) {
          $(window).load(function () {
            var oldLeft = self._getScrollLeft(),
                oldTop = self._getScrollTop();

            self._setScrollLeft(oldLeft + 1);

            self._setScrollTop(oldTop + 1);

            self._setScrollLeft(oldLeft);

            self._setScrollTop(oldTop);
          });
        }

        this._setScrollLeft(oldLeft);

        this._setScrollTop(oldTop);
      },
      _detectViewport: function _detectViewport() {
        var viewportOffsets = this.$viewportElement.offset(),
            hasOffsets = viewportOffsets !== null && viewportOffsets !== undefined;
        this.viewportWidth = this.$viewportElement.width();
        this.viewportHeight = this.$viewportElement.height();
        this.viewportOffsetTop = hasOffsets ? viewportOffsets.top : 0;
        this.viewportOffsetLeft = hasOffsets ? viewportOffsets.left : 0;
      },
      _findParticles: function _findParticles() {
        var self = this,
            scrollLeft = this._getScrollLeft(),
            scrollTop = this._getScrollTop();

        if (this.particles !== undefined) {
          for (var i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].$element.data('stellar-elementIsActive', undefined);
          }
        }

        this.particles = [];
        if (!this.options.parallaxElements) return;
        this.$element.find('[data-stellar-ratio]').each(function (i) {
          var $this = $(this),
              horizontalOffset,
              verticalOffset,
              positionLeft,
              positionTop,
              marginLeft,
              marginTop,
              $offsetParent,
              offsetLeft,
              offsetTop,
              parentOffsetLeft = 0,
              parentOffsetTop = 0,
              tempParentOffsetLeft = 0,
              tempParentOffsetTop = 0; // Ensure this element isn't already part of another scrolling element

          if (!$this.data('stellar-elementIsActive')) {
            $this.data('stellar-elementIsActive', this);
          } else if ($this.data('stellar-elementIsActive') !== this) {
            return;
          }

          self.options.showElement($this); // Save/restore the original top and left CSS values in case we refresh the particles or destroy the instance

          if (!$this.data('stellar-startingLeft')) {
            $this.data('stellar-startingLeft', $this.css('left'));
            $this.data('stellar-startingTop', $this.css('top'));
          } else {
            $this.css('left', $this.data('stellar-startingLeft'));
            $this.css('top', $this.data('stellar-startingTop'));
          }

          positionLeft = $this.position().left;
          positionTop = $this.position().top; // Catch-all for margin top/left properties (these evaluate to 'auto' in IE7 and IE8)

          marginLeft = $this.css('margin-left') === 'auto' ? 0 : parseInt($this.css('margin-left'), 10);
          marginTop = $this.css('margin-top') === 'auto' ? 0 : parseInt($this.css('margin-top'), 10);
          offsetLeft = $this.offset().left - marginLeft;
          offsetTop = $this.offset().top - marginTop; // Calculate the offset parent

          $this.parents().each(function () {
            var $this = $(this);

            if ($this.data('stellar-offset-parent') === true) {
              parentOffsetLeft = tempParentOffsetLeft;
              parentOffsetTop = tempParentOffsetTop;
              $offsetParent = $this;
              return false;
            } else {
              tempParentOffsetLeft += $this.position().left;
              tempParentOffsetTop += $this.position().top;
            }
          }); // Detect the offsets

          horizontalOffset = $this.data('stellar-horizontal-offset') !== undefined ? $this.data('stellar-horizontal-offset') : $offsetParent !== undefined && $offsetParent.data('stellar-horizontal-offset') !== undefined ? $offsetParent.data('stellar-horizontal-offset') : self.horizontalOffset;
          verticalOffset = $this.data('stellar-vertical-offset') !== undefined ? $this.data('stellar-vertical-offset') : $offsetParent !== undefined && $offsetParent.data('stellar-vertical-offset') !== undefined ? $offsetParent.data('stellar-vertical-offset') : self.verticalOffset; // Add our object to the particles collection

          self.particles.push({
            $element: $this,
            $offsetParent: $offsetParent,
            isFixed: $this.css('position') === 'fixed',
            horizontalOffset: horizontalOffset,
            verticalOffset: verticalOffset,
            startingPositionLeft: positionLeft,
            startingPositionTop: positionTop,
            startingOffsetLeft: offsetLeft,
            startingOffsetTop: offsetTop,
            parentOffsetLeft: parentOffsetLeft,
            parentOffsetTop: parentOffsetTop,
            stellarRatio: $this.data('stellar-ratio') !== undefined ? $this.data('stellar-ratio') : 1,
            width: $this.outerWidth(true),
            height: $this.outerHeight(true),
            isHidden: false
          });
        });
      },
      _findBackgrounds: function _findBackgrounds() {
        var self = this,
            scrollLeft = this._getScrollLeft(),
            scrollTop = this._getScrollTop(),
            $backgroundElements;

        this.backgrounds = [];
        if (!this.options.parallaxBackgrounds) return;
        $backgroundElements = this.$element.find('[data-stellar-background-ratio]');

        if (this.$element.data('stellar-background-ratio')) {
          $backgroundElements = $backgroundElements.add(this.$element);
        }

        $backgroundElements.each(function () {
          var $this = $(this),
              backgroundPosition = getBackgroundPosition($this),
              horizontalOffset,
              verticalOffset,
              positionLeft,
              positionTop,
              marginLeft,
              marginTop,
              offsetLeft,
              offsetTop,
              $offsetParent,
              parentOffsetLeft = 0,
              parentOffsetTop = 0,
              tempParentOffsetLeft = 0,
              tempParentOffsetTop = 0; // Ensure this element isn't already part of another scrolling element

          if (!$this.data('stellar-backgroundIsActive')) {
            $this.data('stellar-backgroundIsActive', this);
          } else if ($this.data('stellar-backgroundIsActive') !== this) {
            return;
          } // Save/restore the original top and left CSS values in case we destroy the instance


          if (!$this.data('stellar-backgroundStartingLeft')) {
            $this.data('stellar-backgroundStartingLeft', backgroundPosition[0]);
            $this.data('stellar-backgroundStartingTop', backgroundPosition[1]);
          } else {
            setBackgroundPosition($this, $this.data('stellar-backgroundStartingLeft'), $this.data('stellar-backgroundStartingTop'));
          } // Catch-all for margin top/left properties (these evaluate to 'auto' in IE7 and IE8)


          marginLeft = $this.css('margin-left') === 'auto' ? 0 : parseInt($this.css('margin-left'), 10);
          marginTop = $this.css('margin-top') === 'auto' ? 0 : parseInt($this.css('margin-top'), 10);
          offsetLeft = $this.offset().left - marginLeft - scrollLeft;
          offsetTop = $this.offset().top - marginTop - scrollTop; // Calculate the offset parent

          $this.parents().each(function () {
            var $this = $(this);

            if ($this.data('stellar-offset-parent') === true) {
              parentOffsetLeft = tempParentOffsetLeft;
              parentOffsetTop = tempParentOffsetTop;
              $offsetParent = $this;
              return false;
            } else {
              tempParentOffsetLeft += $this.position().left;
              tempParentOffsetTop += $this.position().top;
            }
          }); // Detect the offsets

          horizontalOffset = $this.data('stellar-horizontal-offset') !== undefined ? $this.data('stellar-horizontal-offset') : $offsetParent !== undefined && $offsetParent.data('stellar-horizontal-offset') !== undefined ? $offsetParent.data('stellar-horizontal-offset') : self.horizontalOffset;
          verticalOffset = $this.data('stellar-vertical-offset') !== undefined ? $this.data('stellar-vertical-offset') : $offsetParent !== undefined && $offsetParent.data('stellar-vertical-offset') !== undefined ? $offsetParent.data('stellar-vertical-offset') : self.verticalOffset;
          self.backgrounds.push({
            $element: $this,
            $offsetParent: $offsetParent,
            isFixed: $this.css('background-attachment') === 'fixed',
            horizontalOffset: horizontalOffset,
            verticalOffset: verticalOffset,
            startingValueLeft: backgroundPosition[0],
            startingValueTop: backgroundPosition[1],
            startingBackgroundPositionLeft: isNaN(parseInt(backgroundPosition[0], 10)) ? 0 : parseInt(backgroundPosition[0], 10),
            startingBackgroundPositionTop: isNaN(parseInt(backgroundPosition[1], 10)) ? 0 : parseInt(backgroundPosition[1], 10),
            startingPositionLeft: $this.position().left,
            startingPositionTop: $this.position().top,
            startingOffsetLeft: offsetLeft,
            startingOffsetTop: offsetTop,
            parentOffsetLeft: parentOffsetLeft,
            parentOffsetTop: parentOffsetTop,
            stellarRatio: $this.data('stellar-background-ratio') === undefined ? 1 : $this.data('stellar-background-ratio')
          });
        });
      },
      _reset: function _reset() {
        var particle, startingPositionLeft, startingPositionTop, background, i;

        for (i = this.particles.length - 1; i >= 0; i--) {
          particle = this.particles[i];
          startingPositionLeft = particle.$element.data('stellar-startingLeft');
          startingPositionTop = particle.$element.data('stellar-startingTop');

          this._setPosition(particle.$element, startingPositionLeft, startingPositionLeft, startingPositionTop, startingPositionTop);

          this.options.showElement(particle.$element);
          particle.$element.data('stellar-startingLeft', null).data('stellar-elementIsActive', null).data('stellar-backgroundIsActive', null);
        }

        for (i = this.backgrounds.length - 1; i >= 0; i--) {
          background = this.backgrounds[i];
          background.$element.data('stellar-backgroundStartingLeft', null).data('stellar-backgroundStartingTop', null);
          setBackgroundPosition(background.$element, background.startingValueLeft, background.startingValueTop);
        }
      },
      destroy: function destroy() {
        this._reset();

        this.$scrollElement.unbind('resize.' + this.name).unbind('scroll.' + this.name);
        this._animationLoop = $.noop;
        $(window).unbind('load.' + this.name).unbind('resize.' + this.name);
      },
      _setOffsets: function _setOffsets() {
        var self = this,
            $window = $(window);
        $window.unbind('resize.horizontal-' + this.name).unbind('resize.vertical-' + this.name);

        if (typeof this.options.horizontalOffset === 'function') {
          this.horizontalOffset = this.options.horizontalOffset();
          $window.bind('resize.horizontal-' + this.name, function () {
            self.horizontalOffset = self.options.horizontalOffset();
          });
        } else {
          this.horizontalOffset = this.options.horizontalOffset;
        }

        if (typeof this.options.verticalOffset === 'function') {
          this.verticalOffset = this.options.verticalOffset();
          $window.bind('resize.vertical-' + this.name, function () {
            self.verticalOffset = self.options.verticalOffset();
          });
        } else {
          this.verticalOffset = this.options.verticalOffset;
        }
      },
      _repositionElements: function _repositionElements() {
        var scrollLeft = this._getScrollLeft(),
            scrollTop = this._getScrollTop(),
            horizontalOffset,
            verticalOffset,
            particle,
            fixedRatioOffset,
            background,
            bgLeft,
            bgTop,
            isVisibleVertical = true,
            isVisibleHorizontal = true,
            newPositionLeft,
            newPositionTop,
            newOffsetLeft,
            newOffsetTop,
            i; // First check that the scroll position or container size has changed


        if (this.currentScrollLeft === scrollLeft && this.currentScrollTop === scrollTop && this.currentWidth === this.viewportWidth && this.currentHeight === this.viewportHeight) {
          return;
        } else {
          this.currentScrollLeft = scrollLeft;
          this.currentScrollTop = scrollTop;
          this.currentWidth = this.viewportWidth;
          this.currentHeight = this.viewportHeight;
        } // Reposition elements


        for (i = this.particles.length - 1; i >= 0; i--) {
          particle = this.particles[i];
          fixedRatioOffset = particle.isFixed ? 1 : 0; // Calculate position, then calculate what the particle's new offset will be (for visibility check)

          if (this.options.horizontalScrolling) {
            newPositionLeft = (scrollLeft + particle.horizontalOffset + this.viewportOffsetLeft + particle.startingPositionLeft - particle.startingOffsetLeft + particle.parentOffsetLeft) * -(particle.stellarRatio + fixedRatioOffset - 1) + particle.startingPositionLeft;
            newOffsetLeft = newPositionLeft - particle.startingPositionLeft + particle.startingOffsetLeft;
          } else {
            newPositionLeft = particle.startingPositionLeft;
            newOffsetLeft = particle.startingOffsetLeft;
          }

          if (this.options.verticalScrolling) {
            newPositionTop = (scrollTop + particle.verticalOffset + this.viewportOffsetTop + particle.startingPositionTop - particle.startingOffsetTop + particle.parentOffsetTop) * -(particle.stellarRatio + fixedRatioOffset - 1) + particle.startingPositionTop;
            newOffsetTop = newPositionTop - particle.startingPositionTop + particle.startingOffsetTop;
          } else {
            newPositionTop = particle.startingPositionTop;
            newOffsetTop = particle.startingOffsetTop;
          } // Check visibility


          if (this.options.hideDistantElements) {
            isVisibleHorizontal = !this.options.horizontalScrolling || newOffsetLeft + particle.width > (particle.isFixed ? 0 : scrollLeft) && newOffsetLeft < (particle.isFixed ? 0 : scrollLeft) + this.viewportWidth + this.viewportOffsetLeft;
            isVisibleVertical = !this.options.verticalScrolling || newOffsetTop + particle.height > (particle.isFixed ? 0 : scrollTop) && newOffsetTop < (particle.isFixed ? 0 : scrollTop) + this.viewportHeight + this.viewportOffsetTop;
          }

          if (isVisibleHorizontal && isVisibleVertical) {
            if (particle.isHidden) {
              this.options.showElement(particle.$element);
              particle.isHidden = false;
            }

            this._setPosition(particle.$element, newPositionLeft, particle.startingPositionLeft, newPositionTop, particle.startingPositionTop);
          } else {
            if (!particle.isHidden) {
              this.options.hideElement(particle.$element);
              particle.isHidden = true;
            }
          }
        } // Reposition backgrounds


        for (i = this.backgrounds.length - 1; i >= 0; i--) {
          background = this.backgrounds[i];
          fixedRatioOffset = background.isFixed ? 0 : 1;
          bgLeft = this.options.horizontalScrolling ? (scrollLeft + background.horizontalOffset - this.viewportOffsetLeft - background.startingOffsetLeft + background.parentOffsetLeft - background.startingBackgroundPositionLeft) * (fixedRatioOffset - background.stellarRatio) + 'px' : background.startingValueLeft;
          bgTop = this.options.verticalScrolling ? (scrollTop + background.verticalOffset - this.viewportOffsetTop - background.startingOffsetTop + background.parentOffsetTop - background.startingBackgroundPositionTop) * (fixedRatioOffset - background.stellarRatio) + 'px' : background.startingValueTop;
          setBackgroundPosition(background.$element, bgLeft, bgTop);
        }
      },
      _handleScrollEvent: function _handleScrollEvent() {
        var self = this,
            ticking = false;

        var update = function update() {
          self._repositionElements();

          ticking = false;
        };

        var requestTick = function requestTick() {
          if (!ticking) {
            requestAnimFrame(update);
            ticking = true;
          }
        };

        this.$scrollElement.bind('scroll.' + this.name, requestTick);
        requestTick();
      },
      _startAnimationLoop: function _startAnimationLoop() {
        var self = this;

        this._animationLoop = function () {
          requestAnimFrame(self._animationLoop);

          self._repositionElements();
        };

        this._animationLoop();
      }
    };

    $.fn[pluginName] = function (options) {
      var args = arguments;

      if (options === undefined || _typeof(options) === 'object') {
        return this.each(function () {
          if (!$.data(this, 'plugin_' + pluginName)) {
            $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
          }
        });
      } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
        return this.each(function () {
          var instance = $.data(this, 'plugin_' + pluginName);

          if (instance instanceof Plugin && typeof instance[options] === 'function') {
            instance[options].apply(instance, Array.prototype.slice.call(args, 1));
          }

          if (options === 'destroy') {
            $.data(this, 'plugin_' + pluginName, null);
          }
        });
      }
    };

    $[pluginName] = function (options) {
      var $window = $(window);
      return $window.stellar.apply($window, Array.prototype.slice.call(arguments, 0));
    }; // Expose the scroll and position property function hashes so they can be extended


    $[pluginName].scrollProperty = scrollProperty;
    $[pluginName].positionProperty = positionProperty; // Expose the plugin class so it can be modified

    window.Stellar = Plugin;
  })(jQuery, this, document);

  $.stellar({
    horizontalScrolling: false,
    responsive: true,
    verticalOffset: 40
  }); /////////////////////////////////////////////////////////////////////////
  //Scroll 

  $('a.scroll').click(function () {
    var target = $(this).attr('href');
    $('html, body').animate({
      scrollTop: $(target).offset().top - 70
    }, 800);
    return false;
  });
  $(".nav-h").click(function () {
    $(".nav-h .toggle-mnu").toggleClass("on"); //return false;
  });
}); //end