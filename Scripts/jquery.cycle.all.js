﻿/*
* jQuery Cycle Plugin for light-weight slideshows
* Examples and documentation at: http://malsup.com/jquery/cycle/
* Copyright (c) 2007-2008 M. Alsup
* Version: 2.20 (05/23/2008)
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
* Requires: jQuery v1.1.3.1 or later
*
* Based on the work of:
*  1) Matt Oakes (http://portfolio.gizone.co.uk/applications/slideshow/)
*  2) Torsten Baldes (http://medienfreunde.com/lab/innerfade/)
*  3) Benjamin Sterling (http://www.benjaminsterling.com/experiments/jqShuffle/)
*/
(function ($) {

    var ver = '2.20';
    var ie6 = $.browser.msie && /MSIE 6.0/.test(navigator.userAgent);
    var cycleTimeout = new Array();
    var cyclePause = new Array();
    var cycleComplete = new Array();
    function log() {
        if (window.console && window.console.log)
            window.console.log('[cycle] ' + Array.prototype.join.call(arguments, ''));
    };

    $.fn.cycle = function (options) {
        return this.each(function () {
            options = options || {};
            // support metadata plugin (v1.0 and v2.0)
            var opts = $.extend({}, $.fn.cycle.defaults, options || {}, $.metadata ? $cont.metadata() : $.meta ? $cont.data() : {});

            if (options.constructor == String) {
                switch (options) {
                    case 'stop':
                        clearTimeout(cycleTimeout[opts.this_i]);
                        cycleTimeout[opts.this_i] = 0;
                        return;
                    case 'pause':
                        cyclePause[opts.this_i] = 1;
                        return;
                    case 'resume':
                        if (!cycleComplete[opts.this_i]) cyclePause[opts.this_i] = 0;
                        return;
                    default:
                        options = { fx: options };
                };
            }

            // stop existing slideshow for this container (if there is one)
            clearTimeout(cycleTimeout[opts.this_i]);
            cycleTimeout[opts.this_i] = 0;
            cyclePause[opts.this_i] = 0;
            cycleComplete[opts.this_i] = false;

            var $cont = $(this);
            var $slides = options.slideExpr ? $(options.slideExpr, this) : $cont.children();
            var els = $slides.get();
            if (els.length < 2) {
                log('terminating; too few slides: ' + els.length);
                //$('#slideshow_nav').css("display","none");
                return; // don't bother
            }


            if (opts.autostop)
                opts.countdown = opts.autostopCount || els.length;

            opts.before = opts.before ? [opts.before] : [];
            opts.after = opts.after ? [opts.after] : [];
            opts.after.unshift(function () { opts.busy = 0; });
            if (opts.continuous)
                opts.after.push(function () { go(els, opts, 0, !opts.rev); });

            // clearType corrections
            if (ie6 && opts.cleartype && !opts.cleartypeNoBg)
                clearTypeFix($slides);

            // allow shorthand overrides of width, height and timeout
            var cls = this.className;
            opts.width = parseInt((cls.match(/w:(\d+)/) || [])[1]) || opts.width;
            opts.height = parseInt((cls.match(/h:(\d+)/) || [])[1]) || opts.height;
            opts.timeout = parseInt((cls.match(/t:(\d+)/) || [])[1]) || opts.timeout;

            if ($cont.css('position') == 'static')
                $cont.css('position', 'relative');
            $cont.css('height', opts.height + 'px');
            if (opts.width)
                $cont.width(opts.width);
            if (opts.height && opts.height != 'auto')
                $cont.height(opts.height);

            if (opts.random) {
                opts.randomMap = [];
                for (var i = 0; i < els.length; i++)
                    opts.randomMap.push(i);
                opts.randomMap.sort(function (a, b) { return Math.random() - 0.5; });
                opts.randomIndex = 0;
                opts.startingSlide = opts.randomMap[0];
            }
            else if (opts.startingSlide >= els.length)
                opts.startingSlide = 0; // catch bogus input
            var first = opts.startingSlide || 0;
            $slides.css({ position: 'absolute', top: 0, left: 0, height: "auto" }).hide().each(function (i) {
                var z = first ? i >= first ? els.length - (i - first) : first - i : els.length - i;
                $(this).css('z-index', z)
            });

            $(els[first]).css('opacity', 1).show(); // opacity bit needed to handle reinit case
            if ($.browser.msie) els[first].style.removeAttribute('filter');

            if (opts.fit && opts.width)
                $slides.width(opts.width);
            if (opts.fit && opts.height && opts.height != 'auto')
                $slides.height(opts.height);
            if (opts.pause)
                $cont.hover(function () { cyclePause[opts.this_i] = 1; }, function () { if (!cycleComplete[opts.this_i]) cyclePause[opts.this_i] = 0; });

            // run transition init fn
            var init = $.fn.cycle.transitions[opts.fx];
            if ($.isFunction(init))
                init($cont, $slides, opts);
            else if (opts.fx != 'custom')
                log('unknown transition: ' + opts.fx);

            $slides.each(function () {
                var $el = $(this);
                this.cycleH = (opts.fit && opts.height) ? opts.height : $el.height();
                this.cycleW = (opts.fit && opts.width) ? opts.width : $el.width();
            });

            opts.cssBefore = opts.cssBefore || {};
            opts.animIn = opts.animIn || {};
            opts.animOut = opts.animOut || {};

            $slides.not(':eq(' + first + ')').css(opts.cssBefore);
            if (opts.cssFirst)
                $($slides[first]).css(opts.cssFirst);

            if (opts.timeout) {
                // ensure that timeout and speed settings are sane
                if (opts.speed.constructor == String)
                    opts.speed = { slow: 600, fast: 200}[opts.speed] || 400;
                if (!opts.sync)
                    opts.speed = opts.speed / 2;
                while ((opts.timeout - opts.speed) < 10)
                    opts.timeout += opts.speed;
            }
            if (opts.easing)
                opts.easeIn = opts.easeOut = opts.easing;
            if (!opts.speedIn)
                opts.speedIn = opts.speed;
            if (!opts.speedOut)
                opts.speedOut = opts.speed;

            opts.slideCount = els.length;
            opts.currSlide = first;
            if (opts.random) {
                opts.nextSlide = opts.currSlide;
                if (++opts.randomIndex == els.length)
                    opts.randomIndex = 0;
                opts.nextSlide = opts.randomMap[opts.randomIndex];
            }
            else
                opts.nextSlide = opts.startingSlide >= (els.length - 1) ? 0 : opts.startingSlide + 1;

            // fire artificial events
            var e0 = $slides[first];
            if (opts.before.length)
                opts.before[0].apply(e0, [e0, e0, opts, true]);
            if (opts.after.length > 1)
                opts.after[1].apply(e0, [e0, e0, opts, true]);

            if (opts.click && !opts.next)
                opts.next = opts.click;
            if (opts.next)
                $(opts.next).bind('click', function () { return advance(els, opts, opts.rev ? -1 : 1) });
            if (opts.prev)
                $(opts.prev).bind('click', function () { return advance(els, opts, opts.rev ? 1 : -1) });
            if (opts.pager)
                buildPager(els, opts);
            if (opts.timeout || opts.continuous)
                cycleTimeout[opts.this_i] = setTimeout(
                function () { go(els, opts, 0, !opts.rev) },
                opts.continuous ? 10 : opts.timeout);
            if (opts.contain)
                $(opts.contain).bind('click', function () { return advance(els, opts, opts.rev ? -1 : 1) });

            // expose fn for adding slides after the show has started
            opts.addSlide = function (newSlide) {
                var $s = $(newSlide), s = $s[0];
                if (!opts.autostopCount)
                    opts.countdown++;
                els.push(s);
                if (opts.els)
                    opts.els.push(s); // shuffle needs this
                opts.slideCount = els.length;
                $s.css('position', 'absolute').css(opts.cssBefore).appendTo($cont);

                if (ie6 && opts.cleartype && !opts.cleartypeNoBg)
                    clearTypeFix($s);

                if (opts.fit && opts.width)
                    $s.width(opts.width);
                if (opts.fit && opts.height && opts.height != 'auto')
                    $slides.height(opts.height);
                s.cycleH = (opts.fit && opts.height) ? opts.height : $s.height();
                s.cycleW = (opts.fit && opts.width) ? opts.width : $s.width();
            };

        });
    };

    function go(els, opts, manual, fwd) {
        if (opts.busy) return;
        var p = els[0].parentNode, curr = els[opts.currSlide], next = els[opts.nextSlide];
        if (cycleTimeout[opts.this_i] === 0 && !manual)
            return;

        if (!manual && !cyclePause[opts.this_i] &&
        ((opts.autostop && (--opts.countdown <= 0)) ||
        (opts.nowrap && !opts.random && opts.nextSlide < opts.currSlide))) {
            if (opts.end)
                opts.end(opts);
            return;
        }

        if (manual || !cyclePause[opts.this_i]) {
            if (opts.before.length)
                $.each(opts.before, function (i, o) { o.apply(next, [curr, next, opts, fwd]); });
            var after = function () {
                if ($.browser.msie && opts.cleartype)
                    this.style.removeAttribute('filter');
                $.each(opts.after, function (i, o) { o.apply(next, [curr, next, opts, fwd]); });
            };

            if (opts.nextSlide != opts.currSlide) {
                opts.busy = 1;
                if (opts.fxFn)
                    opts.fxFn(curr, next, opts, after, fwd);
                else if ($.isFunction($.fn.cycle[opts.fx]))
                    $.fn.cycle[opts.fx](curr, next, opts, after);
                else
                    $.fn.cycle.custom(curr, next, opts, after);
            }
            if (opts.random) {
                opts.currSlide = opts.nextSlide;
                if (++opts.randomIndex == els.length)
                    opts.randomIndex = 0;
                opts.nextSlide = opts.randomMap[opts.randomIndex];
            }
            else { // sequence
                var roll = (opts.nextSlide + 1) == els.length;
                opts.nextSlide = roll ? 0 : opts.nextSlide + 1;
                opts.currSlide = roll ? els.length - 1 : opts.nextSlide - 1;
            }
            if (opts.pager) {
                $.fn.cycle.updateActivePagerLink(opts.pager, opts.currSlide);
            }
        }
        if (opts.timeout && !opts.continuous)
            cycleTimeout[opts.this_i] = setTimeout(function () { go(els, opts, 0, !opts.rev) }, opts.timeout);
        else if (opts.continuous && cyclePause[opts.this_i])
            cycleTimeout[opts.this_i] = setTimeout(function () { go(els, opts, 0, !opts.rev) }, 10);

        var next = (parseInt(opts.nextSlide) == 0) ? els.length : parseInt(opts.nextSlide);
        donum(next, els.length, els[0].parentNode.id);

    };

    $.fn.cycle.updateActivePagerLink = function (pager, currSlide) {
        $(pager).find('a').removeClass('activeSlide').filter('a:eq(' + currSlide + ')').addClass('activeSlide');
    };

    // advance slide forward or back
    function advance(els, opts, val) {
        var p = els[0].parentNode, timeout = cycleTimeout[opts.this_i];
        if (timeout) {
            clearTimeout(timeout);
            cycleTimeout[opts.this_i] = 0;
            cyclePause[opts.this_i] = true;
            cycleComplete[opts.this_i] = true;
        }
        opts.nextSlide = opts.currSlide + val;
        if (opts.nextSlide < 0) {
            if (opts.nowrap) return false;
            opts.nextSlide = els.length - 1;
        }
        else if (opts.nextSlide >= els.length) {
            if (opts.nowrap) return false;
            opts.nextSlide = 0;
        }
        if (opts.prevNextClick && typeof opts.prevNextClick == 'function')
            opts.prevNextClick(val > 0, opts.nextSlide, els[opts.nextSlide]);

        donum(parseInt(opts.nextSlide + 1), els.length, els[0].parentNode.id);
        go(els, opts, 1, val >= 0);
        return false;
    };

    function donum(next, total, id) {
        if ($("slideconfig").attr("count_style") == "parenth") var count_nav = '(' + next + ' of ' + total + ')';
        else if ($("slideconfig").attr("count_style") == "no_parenth") var count_nav = next + ' of ' + total;
        id = id.replace("slideshow_container_", "");
        $('#slideshow_count_' + id).html(count_nav);
    };

    function buildPager(els, opts) {
        var $p = $(opts.pager);
        $.each(els, function (i, o) {
            var $a = (typeof opts.pagerAnchorBuilder == 'function')
            ? $(opts.pagerAnchorBuilder(i, o))
            : $('<a href="#">' + (i + 1) + '</a>');
            // don't reparent if anchor is in the dom
            if ($a.parents('body').length == 0)
                $a.appendTo($p);
            $a.bind(opts.pagerEvent, function () {
                opts.nextSlide = i;
                donum(parseInt(opts.nextSlide + 1), els.length, els[0].parentNode.id);
                var p = els[0].parentNode, timeout = cycleTimeout[opts.this_i];
                if (timeout) {
                    clearTimeout(timeout);
                    cycleTimeout[opts.this_i] = 0;
                    cyclePause[opts.this_i] = true;
                    cycleComplete[opts.this_i] = true;
                }
                if (typeof opts.pagerClick == 'function')
                    opts.pagerClick(opts.nextSlide, els[opts.nextSlide]);
                go(els, opts, 1, !opts.rev);
                return false;
            });
        });
        //$p.find('a').filter('a:eq('+opts.startingSlide+')').addClass('activeSlide');
        $.fn.cycle.updateActivePagerLink(opts.pager, opts.startingSlide);
    };

    // this fixes clearType problems in ie6 by setting an explicit bg color
    function clearTypeFix($slides) {
        function hex(s) {
            var s = parseInt(s).toString(16);
            return s.length < 2 ? '0' + s : s;
        };
        function getBg(e) {
            for (; e && e.nodeName.toLowerCase() != 'html'; e = e.parentNode) {
                var v = $.css(e, 'background-color');
                if (v.indexOf('rgb') >= 0) {
                    var rgb = v.match(/\d+/g);
                    return '#' + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
                }
                if (v && v != 'transparent')
                    return v;
            }
            return '#ffffff';
        };
        $slides.each(function () { $(this).css('background-color', getBg(this)); });
    };


    $.fn.cycle.custom = function (curr, next, opts, cb) {
        var $l = $(curr), $n = $(next);
        $n.css(opts.cssBefore);
        var fn = function () { $n.animate(opts.animIn, opts.speedIn, opts.easeIn, cb) };
        $l.animate(opts.animOut, opts.speedOut, opts.easeOut, function () {
            if (opts.cssAfter) $l.css(opts.cssAfter);
            if (!opts.sync) fn();
        });
        if (opts.sync) fn();
    };

    $.fn.cycle.transitions = {
        fade: function ($cont, $slides, opts) {
            $slides.not(':eq(' + opts.startingSlide + ')').css('opacity', 0);
            opts.before.push(function () { $(this).show() });
            opts.animIn = { opacity: 1 };
            opts.animOut = { opacity: 0 };
            opts.cssBefore = { opacity: 0 };
            opts.cssAfter = { display: 'none' };
        }
    };

    $.fn.cycle.ver = function () { return ver; };

    // override these globally if you like (they are all optional)
    $.fn.cycle.defaults = {
        fx: 'fade', // one of: fade, shuffle, zoom, scrollLeft, etc
        timeout: 2000,  // milliseconds between slide transitions (0 to disable auto advance)
        continuous: 0,     // true to start next transition immediately after current one completes
        speed: '2000',  // speed of the transition (any valid fx speed value)
        speedIn: null,  // speed of the 'in' transition
        speedOut: null,  // speed of the 'out' transition
        next: null,  // id of element to use as click trigger for next slide
        prev: null,  // id of element to use as click trigger for previous slide
        prevNextClick: null,  // callback fn for prev/next clicks:  function(isNext, zeroBasedSlideIndex, slideElement)
        pager: null,  // id of element to use as pager container
        pagerClick: null,  // callback fn for pager clicks:  function(zeroBasedSlideIndex, slideElement)
        pagerEvent: 'click', // event which drives the pager navigation
        pagerAnchorBuilder: null, // callback fn for building anchor links
        before: null,  // transition callback (scope set to element to be shown)
        after: null,  // transition callback (scope set to element that was shown)
        end: null,  // callback invoked when the slideshow terminates (use with autostop or nowrap options)
        easing: null,  // easing method for both in and out transitions
        easeIn: null,  // easing for "in" transition
        easeOut: null,  // easing for "out" transition
        shuffle: null,  // coords for shuffle animation, ex: { top:15, left: 200 }
        animIn: null,  // properties that define how the slide animates in
        animOut: null,  // properties that define how the slide animates out
        cssBefore: null,  // properties that define the initial state of the slide before transitioning in
        cssAfter: null,  // properties that defined the state of the slide after transitioning out
        fxFn: null,  // function used to control the transition
        height: 'auto', // container height
        startingSlide: 0,     // zero-based index of the first slide to be displayed
        sync: 1,     // true if in/out transitions should occur simultaneously
        random: 0,     // true for random, false for sequence (not applicable to shuffle fx)
        fit: 0,     // force slides to fit container
        pause: 1,     // true to enable "pause on hover"
        autostop: 0,     // true to end slideshow after X transitions (where X == slide count)
        autostopCount: 0,     // number of transitions (optionally used with autostop to define X)
        delay: -1,     // additional delay (in ms) for first transition (hint: can be negative)
        slideExpr: null,  // expression for selecting slides (if something other than all children is required)
        cleartype: 0,     // true if clearType corrections should be applied (for IE)
        nowrap: 0      // true to prevent slideshow from wrapping
    };

})(jQuery);


/*
* jQuery Cycle Plugin Transition Definitions
* This script is a plugin for the jQuery Cycle Plugin
* Examples and documentation at: http://malsup.com/jquery/cycle/
* Copyright (c) 2007-2008 M. Alsup
* Version:  2.20
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*/
(function ($) {

    //
    // These functions define one-time slide initialization for the named
    // transitions. To save file size feel free to remove any of these that you 
    // don't need.
    //

    // scrollUp/Down/Left/Right
    $.fn.cycle.transitions.scrollUp = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.cssBefore.top = curr.offsetHeight;
            opts.animOut.top = 0 - curr.offsetHeight;
        });
        opts.cssFirst = { top: 0 };
        opts.animIn = { top: 0 };
        opts.cssAfter = { display: 'none' };
    };
    $.fn.cycle.transitions.scrollDown = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.cssBefore.top = 0 - next.offsetHeight;
            opts.animOut.top = next.offsetHeight;
        });
        opts.cssFirst = { top: 0 };
        opts.animIn = { top: 0 };
        opts.cssAfter = { display: 'none' };
    };
    $.fn.cycle.transitions.scrollLeft = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.cssBefore.left = next.offsetWidth;
            opts.animOut.left = 0 - curr.offsetWidth;
        });
        opts.cssFirst = { left: 0 };
        opts.animIn = { left: 0 };
    };
    $.fn.cycle.transitions.scrollRight = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            var endpoint = next.offsetWidth > curr.offsetWidth ? next.offsetWidth : curr.offsetWidth;
            opts.cssBefore.left = 0 - next.offsetWidth;
            opts.animOut.left = endpoint;
        });
        opts.cssFirst = { left: 0 };
        opts.animIn = { left: 0 };
    };
    $.fn.cycle.transitions.scrollHorz = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden').width();
        //    $slides.show();
        opts.before.push(function (curr, next, opts, fwd) {
            $(this).show();
            var currW = curr.offsetWidth, nextW = next.offsetWidth;
            opts.cssBefore = fwd ? { left: nextW} : { left: -nextW };
            opts.animIn.left = 0;
            opts.animOut.left = fwd ? -currW : currW;
            $slides.not(curr).css(opts.cssBefore);
        });
        opts.cssFirst = { left: 0 };
        opts.cssAfter = { display: 'none' }
    };
    $.fn.cycle.transitions.scrollVert = function ($cont, $slides, opts) {
        $cont.css('overflow', 'hidden');
        //    $slides.show();
        opts.before.push(function (curr, next, opts, fwd) {
            $(this).show();
            var currH = curr.offsetHeight, nextH = next.offsetHeight;
            opts.cssBefore = fwd ? { top: -nextH} : { top: nextH };
            opts.animIn.top = 0;
            opts.animOut.top = fwd ? currH : -currH;
            $slides.not(curr).css(opts.cssBefore);
        });
        opts.cssFirst = { top: 0 };
        opts.cssAfter = { display: 'none' }
    };

    // slideX/slideY
    $.fn.cycle.transitions.slideX = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(curr).css('zIndex', 1);
        });
        opts.cssBefore = { zIndex: 2 };
        opts.animIn = { width: 'show' };
        opts.animOut = { width: 'hide' };
    };
    $.fn.cycle.transitions.slideY = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(curr).css('zIndex', 1);
        });
        opts.cssBefore = { zIndex: 2 };
        opts.animIn = { height: 'show' };
        opts.animOut = { height: 'hide' };
    };

    // shuffle
    $.fn.cycle.transitions.shuffle = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'visible').width();
        $slides.css({ left: 0, top: 0 });
        opts.before.push(function () { $(this).show() });
        opts.speed = opts.speed / 2; // shuffle has 2 transitions        
        opts.random = 0;
        opts.shuffle = opts.shuffle || { left: -w, top: 15 };
        opts.els = [];
        for (var i = 0; i < $slides.length; i++)
            opts.els.push($slides[i]);

        for (var i = 0; i < opts.startingSlide; i++)
            opts.els.push(opts.els.shift());

        // custom transition fn (hat tip to Benjamin Sterling for this bit of sweetness!)
        opts.fxFn = function (curr, next, opts, cb, fwd) {
            var $el = fwd ? $(curr) : $(next);
            $el.animate(opts.shuffle, opts.speedIn, opts.easeIn, function () {
                fwd ? opts.els.push(opts.els.shift()) : opts.els.unshift(opts.els.pop());
                if (fwd)
                    for (var i = 0, len = opts.els.length; i < len; i++)
                        $(opts.els[i]).css('z-index', len - i);
                else {
                    var z = $(curr).css('z-index');
                    $el.css('z-index', parseInt(z) + 1);
                }
                $el.animate({ left: 0, top: 0 }, opts.speedOut, opts.easeOut, function () {
                    $(fwd ? this : curr).hide();
                    if (cb) cb();
                });
            });
        };
    };

    // turnUp/Down/Left/Right
    $.fn.cycle.transitions.turnUp = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.cssBefore.top = next.cycleH;
            opts.animIn.height = next.cycleH;
        });
        opts.cssFirst = { top: 0 };
        opts.cssBefore = { height: 0 };
        opts.animIn = { top: 0 };
        opts.animOut = { height: 0 };
        opts.cssAfter = { display: 'none' };
    };
    $.fn.cycle.transitions.turnDown = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.animIn.height = next.cycleH;
            opts.animOut.top = curr.cycleH;
        });
        opts.cssFirst = { top: 0 };
        opts.cssBefore = { top: 0, height: 0 };
        opts.animOut = { height: 0 };
        opts.cssAfter = { display: 'none' };
    };
    $.fn.cycle.transitions.turnLeft = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.cssBefore.left = next.cycleW;
            opts.animIn.width = next.cycleW;
        });
        opts.cssBefore = { width: 0 };
        opts.animIn = { left: 0 };
        opts.animOut = { width: 0 };
        opts.cssAfter = { display: 'none' };
    };
    $.fn.cycle.transitions.turnRight = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.animIn.width = next.cycleW;
            opts.animOut.left = curr.cycleW;
        });
        opts.cssBefore = { left: 0, width: 0 };
        opts.animIn = { left: 0 };
        opts.animOut = { width: 0 };
        opts.cssAfter = { display: 'none' };
    };

    // zoom
    $.fn.cycle.transitions.zoom = function ($cont, $slides, opts) {
        opts.cssFirst = { top: 0, left: 0 };
        opts.cssAfter = { display: 'none' };

        opts.before.push(function (curr, next, opts) {
            $(this).show();
            opts.cssBefore = { width: 0, height: 0, top: next.cycleH / 2, left: next.cycleW / 2 };
            opts.animIn = { top: 0, left: 0, width: next.cycleW, height: next.cycleH };
            opts.animOut = { width: 0, height: 0, top: curr.cycleH / 2, left: curr.cycleW / 2 };
        });
    };

    // fadeZoom
    $.fn.cycle.transitions.fadeZoom = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore = { width: 0, height: 0, opacity: 1, left: next.cycleW / 2, top: next.cycleH / 2, zIndex: 1 };
            opts.animIn = { top: 0, left: 0, width: next.cycleW, height: next.cycleH };
        });
        opts.animOut = { opacity: 0 };
        opts.cssAfter = { zIndex: 0 };
    };

    // blindX
    $.fn.cycle.transitions.blindX = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'hidden').width();
        $slides.show();
        opts.before.push(function (curr, next, opts) {
            $(curr).css('zIndex', 1);
        });
        opts.cssBefore = { left: w, zIndex: 2 };
        opts.cssAfter = { zIndex: 1 };
        opts.animIn = { left: 0 };
        opts.animOut = { left: w };
    };
    // blindY
    $.fn.cycle.transitions.blindY = function ($cont, $slides, opts) {
        var h = $cont.css('overflow', 'hidden').height();
        $slides.show();
        opts.before.push(function (curr, next, opts) {
            $(curr).css('zIndex', 1);
        });
        opts.cssBefore = { top: h, zIndex: 2 };
        opts.cssAfter = { zIndex: 1 };
        opts.animIn = { top: 0 };
        opts.animOut = { top: h };
    };
    // blindZ
    $.fn.cycle.transitions.blindZ = function ($cont, $slides, opts) {
        var h = $cont.css('overflow', 'hidden').height();
        var w = $cont.width();
        $slides.show();
        opts.before.push(function (curr, next, opts) {
            $(curr).css('zIndex', 1);
        });
        opts.cssBefore = { top: h, left: w, zIndex: 2 };
        opts.cssAfter = { zIndex: 1 };
        opts.animIn = { top: 0, left: 0 };
        opts.animOut = { top: h, left: w };
    };

    // growX - grow horizontally from centered 0 width
    $.fn.cycle.transitions.growX = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore = { left: this.cycleW / 2, width: 0, zIndex: 2 };
            opts.animIn = { left: 0, width: this.cycleW };
            opts.animOut = { left: 0 };
            $(curr).css('zIndex', 1);
        });
    };
    // growX - grow vertically from centered 0 height
    $.fn.cycle.transitions.growY = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore = { top: this.cycleH / 2, height: 0, zIndex: 2 };
            opts.animIn = { top: 0, height: this.cycleH };
            opts.animOut = { top: 0 };
            $(curr).css('zIndex', 1);
        });
    };

    // curtainX - squeeze in both edges horizontally
    $.fn.cycle.transitions.curtainX = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore = { left: next.cycleW / 2, width: 0, zIndex: 1, display: 'block' };
            opts.animIn = { left: 0, width: this.cycleW };
            opts.animOut = { left: curr.cycleW / 2, width: 0 };
            $(curr).css('zIndex', 2);
        });
        opts.cssAfter = { zIndex: 1, display: 'none' };
    };
    // curtainX - squeeze in both edges vertically
    $.fn.cycle.transitions.curtainY = function ($cont, $slides, opts) {
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore = { top: next.cycleH / 2, height: 0, zIndex: 1, display: 'block' };
            opts.animIn = { top: 0, height: this.cycleH };
            opts.animOut = { top: curr.cycleH / 2, height: 0 };
            $(curr).css('zIndex', 2);
        });
        opts.cssAfter = { zIndex: 1, display: 'none' };
    };

    // cover - curr slide covered by next slide
    $.fn.cycle.transitions.cover = function ($cont, $slides, opts) {
        var d = opts.direction || 'left';
        var w = $cont.css('overflow', 'hidden').width();
        var h = $cont.height();
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore = { zIndex: 2, display: 'block' };
            if (d == 'right')
                opts.cssBefore.left = -w;
            else if (d == 'up')
                opts.cssBefore.top = h;
            else if (d == 'down')
                opts.cssBefore.top = -h;
            else
                opts.cssBefore.left = w;
            $(curr).css('zIndex', 1);
        });
        opts.animIn = { left: 0, top: 0 };
        opts.animOut = { left: 0, top: 0 };
        opts.cssAfter = { zIndex: 2, display: 'none' };
    };

    // uncover - curr slide moves off next slide
    $.fn.cycle.transitions.uncover = function ($cont, $slides, opts) {
        var d = opts.direction || 'left';
        var w = $cont.css('overflow', 'hidden').width();
        var h = $cont.height();
        opts.before.push(function (curr, next, opts) {
            opts.cssBefore.display = 'block';
            if (d == 'right')
                opts.animOut.left = w;
            else if (d == 'up')
                opts.animOut.top = -h;
            else if (d == 'down')
                opts.animOut.top = h;
            else
                opts.animOut.left = -w;
            $(curr).css('zIndex', 2);
        });
        opts.animIn = { left: 0, top: 0 };
        opts.cssBefore = { zIndex: 1, top: 0, left: 0 };
        opts.cssAfter = { zIndex: 1, display: 'none' };
    };

    // toss - move top slide and fade away
    $.fn.cycle.transitions.toss = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'visible').width();
        var h = $cont.height();
        opts.before.push(function (curr, next, opts) {
            $(curr).css('zIndex', 2);
            opts.cssBefore.display = 'block';
            // provide default toss settings if animOut not provided
            if (!opts.animOut.left && !opts.animOut.top)
                opts.animOut = { left: w * 2, top: -h / 2, opacity: 0 };
            else
                opts.animOut.opacity = 0;
        });
        opts.cssBefore = { left: 0, top: 0, zIndex: 1, opacity: 1 };
        opts.animIn = { left: 0 };
        opts.cssAfter = { zIndex: 2, display: 'none' };
    };

    // wipe - clip animation
    $.fn.cycle.transitions.wipe = function ($cont, $slides, opts) {
        var w = $cont.css('overflow', 'hidden').width();
        var h = $cont.height();
        opts.cssBefore = opts.cssBefore || {};
        var clip;
        if (opts.clip) {
            if (/l2r/.test(opts.clip))
                clip = 'rect(0px 0px ' + h + 'px 0px)';
            else if (/r2l/.test(opts.clip))
                clip = 'rect(0px ' + w + 'px ' + h + 'px ' + w + 'px)';
            else if (/t2b/.test(opts.clip))
                clip = 'rect(0px ' + w + 'px 0px 0px)';
            else if (/b2t/.test(opts.clip))
                clip = 'rect(' + h + 'px ' + w + 'px ' + h + 'px 0px)';
            else if (/zoom/.test(opts.clip)) {
                var t = parseInt(h / 2);
                var l = parseInt(w / 2);
                clip = 'rect(' + t + 'px ' + l + 'px ' + t + 'px ' + l + 'px)';
            }
        }

        opts.cssBefore.clip = opts.cssBefore.clip || clip || 'rect(0px 0px 0px 0px)';

        var d = opts.cssBefore.clip.match(/(\d+)/g);
        var t = parseInt(d[0]), r = parseInt(d[1]), b = parseInt(d[2]), l = parseInt(d[3]);

        var first = true;
        opts.before.push(function (curr, next, opts) {
            if (first) {
                first = false;
                return;
            }
            var $curr = $(curr).css('zIndex', 2);
            var $next = $(next).css({
                zIndex: 3,
                display: 'block'
            });

            var step = 1, count = parseInt((opts.speedIn / 13)) - 1;
            function f() {
                var tt = t ? t - parseInt(step * (t / count)) : 0;
                var ll = l ? l - parseInt(step * (l / count)) : 0;
                var bb = b < h ? b + parseInt(step * ((h - b) / count || 1)) : h;
                var rr = r < w ? r + parseInt(step * ((w - r) / count || 1)) : w;
                $next.css({ clip: 'rect(' + tt + 'px ' + rr + 'px ' + bb + 'px ' + ll + 'px)' });
                (step++ <= count) ? setTimeout(f, 13) : $curr.css('display', 'none');
            }
            f();
        });
        opts.cssAfter = {};
        opts.animIn = { left: 0 };
        opts.animOut = { left: 0 };
    };

})(jQuery);