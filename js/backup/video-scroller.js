(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.VideoScroller = factory();
  }
}(this, function() {
/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
"use strict";

var EasingFunctions = {
	// no easing, no acceleration
	linear: function linear(t) {
		return t;
	},
	// accelerating from zero velocity
	easeInQuad: function easeInQuad(t) {
		return t * t;
	},
	// decelerating to zero velocity
	easeOutQuad: function easeOutQuad(t) {
		return t * (2 - t);
	},
	// acceleration until halfway, then deceleration
	easeInOutQuad: function easeInOutQuad(t) {
		return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	},
	// accelerating from zero velocity
	easeInCubic: function easeInCubic(t) {
		return t * t * t;
	},
	// decelerating to zero velocity
	easeOutCubic: function easeOutCubic(t) {
		return --t * t * t + 1;
	},
	// acceleration until halfway, then deceleration
	easeInOutCubic: function easeInOutCubic(t) {
		return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
	},
	// accelerating from zero velocity
	easeInQuart: function easeInQuart(t) {
		return t * t * t * t;
	},
	// decelerating to zero velocity
	easeOutQuart: function easeOutQuart(t) {
		return 1 - --t * t * t * t;
	},
	// acceleration until halfway, then deceleration
	easeInOutQuart: function easeInOutQuart(t) {
		return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
	},
	// accelerating from zero velocity
	easeInQuint: function easeInQuint(t) {
		return t * t * t * t * t;
	},
	// decelerating to zero velocity
	easeOutQuint: function easeOutQuint(t) {
		return 1 + --t * t * t * t * t;
	},
	// acceleration until halfway, then deceleration
	easeInOutQuint: function easeInOutQuint(t) {
		return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
	}
};
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/***
 * VideoScroller.js
 * URL: https://github.com/finnursig/VideoScroller
 * Author: Finnur Sigurðsson (finnursigu@gmail.com)
 */

// IE10+: window.URL.createObjectURL

var VideoScroller = (function () {
    function VideoScroller(_ref) {
        var _this = this;

        var el = _ref.el;
        var _ref$transitionTime = _ref.transitionTime;
        var transitionTime = _ref$transitionTime === undefined ? 2000 : _ref$transitionTime;
        var _ref$invert = _ref.invert;
        var invert = _ref$invert === undefined ? false : _ref$invert;
        var _ref$scrollTimeout = _ref.scrollTimeout;
        var scrollTimeout = _ref$scrollTimeout === undefined ? 300 : _ref$scrollTimeout;
        var _ref$easingFunction = _ref.easingFunction;
        var easingFunction = _ref$easingFunction === undefined ? EasingFunctions.easeOutQuint : _ref$easingFunction;
        var _ref$debug = _ref.debug;
        var debug = _ref$debug === undefined ? false : _ref$debug;

        _classCallCheck(this, VideoScroller);

        if (!el) {
            throw new Error("Missing video element ref.");
        }

        this.el = el;
        this.transitionTime = transitionTime;
        this.invert = invert;
        this.scrollTimeout = scrollTimeout;
        this.easingFunction = typeof easingFunction == "function" ? easingFunction : EasingFunctions[easingFunction];
        this.debug = debug;

        if (!VideoScroller.isCompatibleWithCurrentBrowser()) {
            return;
        }

        if (this.el.getAttribute("data-src")) {

            this.getVideo();
        } else {
            // if video is ready, init
            if (this.el.readyState > 1) {
                this.init();
            } else {
                // else wait for it
                this.el.addEventListener("loadeddata", function () {
                    return _this.init();
                });
            }
        }
    }

    _createClass(VideoScroller, {
        getVideo: {
            value: function getVideo() {
                var _this = this;

                var req = new XMLHttpRequest();

                req.open("get", this.el.getAttribute("data-src"), true);
                req.responseType = "blob";
                req.withCredentials = false;

                req.onload = function () {
                    _this.el.addEventListener("loadeddata", function () {
                        return _this.init();
                    });
                    _this.el.src = window.URL.createObjectURL(req.response);
                };

                req.onprogress = function (requestProgress) {
                    var percentage = Math.round(requestProgress.loaded / requestProgress.total * 100);

                    if (_this.debug) console.log("onprogress", percentage + "%");
                };

                req.onreadystatechange = function () {
                    if (_this.debug) console.log("onreadystatechange", req.readyState);
                };

                req.send();
            }
        },
        init: {
            value: function init() {
                var _this = this;

                this.videoDuration = this.el.duration;

                if (this.debug) {
                    this.el.controls = true;
                }

                this.el.className = this.el.className + " video-scroller-ready";

                window.addEventListener("scroll", function (e) {
                    return _this.onScroll();
                }, false);

                this.start(this.inView(this.el));
            }
        },
        start: {
            value: function start(time) {
                var _this = this;

                this.startTime = Date.now();

                this.currentTime = this.el.currentTime;
                this.targetDuration = this.videoDuration * time - this.el.currentTime;

                if (this.debug) {
                    console.log("time=", time, "targetTime=", this.currentTime, "targetDuration", this.targetDuration);
                }

                if (!this.intervalTimer) {
                    this.intervalTimer = setInterval(function () {
                        return _this.loop();
                    }, 60);
                }
            }
        },
        loop: {
            value: function loop() {
                var i = (Date.now() - this.startTime) / this.transitionTime;
                var easing = this.easingFunction(i);

                if (i >= 1) {
                    return;
                }

                this.el.currentTime = this.currentTime + this.targetDuration * easing;
                this.el.pause();
            }
        },
        inView: {
            value: function inView() {
                var windowHeight = window.innerHeight;

                var elTop = this.el.getBoundingClientRect().top + 150;
                var elHeight = this.el.offsetHeight;

                var fromTop = elTop - windowHeight;

                if (fromTop > 0) {
                    fromTop = 0;
                }

                var percentage = Math.abs(fromTop) / (windowHeight + elHeight);

                if (!this.invert) {
                    percentage = 1 - percentage;
                }

                if (percentage > 1) {
                    return 1;
                } else if (percentage < 0) {
                    return 0;
                }

                return percentage;
            }
        },
        onScroll: {
            value: function onScroll() {
                var _this = this;

                if (this.isWaiting) {
                    return;
                }

                this.isWaiting = true;

                setTimeout(function () {
                    _this.isWaiting = false;

                    var time = _this.inView(_this.el);

                    if (time === undefined) return;

                    _this.start(time);
                }, this.scrollTimeout);
            }
        }
    }, {
        isCompatibleWithCurrentBrowser: {
            value: function isCompatibleWithCurrentBrowser() {
                if (!window.URL || !window.URL.createObjectURL) {
                    return false;
                }

                if (!XMLHttpRequest) {
                    return false;
                }

                return true;
            }
        }
    });

    return VideoScroller;
})();
return VideoScroller;
}));
