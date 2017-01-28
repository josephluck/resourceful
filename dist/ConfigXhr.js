'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ConfigBase2 = require('./ConfigBase.js');

var _ConfigBase3 = _interopRequireDefault(_ConfigBase2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConfigXhr = function (_ConfigBase) {
    _inherits(ConfigXhr, _ConfigBase);

    function ConfigXhr() {
        _classCallCheck(this, ConfigXhr);

        var _this = _possibleConstructorReturn(this, (ConfigXhr.__proto__ || Object.getPrototypeOf(ConfigXhr)).call(this));

        _this.path = '';

        Object.seal(_this);
        return _this;
    }

    return ConfigXhr;
}(_ConfigBase3.default);

exports.default = ConfigXhr;
//# sourceMappingURL=ConfigXhr.js.map