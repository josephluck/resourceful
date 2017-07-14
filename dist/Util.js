'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Util = function () {
    function Util() {
        _classCallCheck(this, Util);
    }

    _createClass(Util, null, [{
        key: 'extend',


        /**
         * @param   {object}    target
         * @param   {object}    source
         * @param   {boolean}   [deep=false]
         * @return  {object}
         */

        value: function extend(target, source) {
            var deep = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var sourceKeys = [];

            if (!target || (typeof target === 'undefined' ? 'undefined' : _typeof(target)) !== 'object') {
                throw new TypeError('[Util#extend] Target must be a valid object');
            }

            if (Array.isArray(source)) {
                for (var i = 0; i < source.length; i++) {
                    sourceKeys.push(i);
                }
            } else if (source) {
                sourceKeys = Object.keys(source);
            }

            for (var _i = 0; _i < sourceKeys.length; _i++) {
                var key = sourceKeys[_i];
                var descriptor = Object.getOwnPropertyDescriptor(source, key);

                // Skip non-enumerable computed properties

                if (typeof descriptor.get === 'function' && !descriptor.enumerable) continue;

                if (!deep || _typeof(source[key]) !== 'object' || source[key] === null) {
                    // All non-object primitives, or all properties if
                    // shallow extend

                    target[key] = source[key];
                } else if (Array.isArray(source[key])) {
                    // Arrays

                    if (!target[key]) {
                        target[key] = [];
                    }

                    this.extend(target[key], source[key], deep);
                } else {
                    // Objects

                    if (!target[key]) {
                        target[key] = {};
                    }

                    this.extend(target[key], source[key], deep);
                }
            }

            return target;
        }
    }]);

    return Util;
}();

exports.default = Util;
//# sourceMappingURL=Util.js.map