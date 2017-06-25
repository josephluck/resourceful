'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ConfigCache = require('./ConfigCache');

var _ConfigCache2 = _interopRequireDefault(_ConfigCache);

var _ConfigData = require('./ConfigData');

var _ConfigData2 = _interopRequireDefault(_ConfigData);

var _ConfigTransform = require('./ConfigTransform');

var _ConfigTransform2 = _interopRequireDefault(_ConfigTransform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConfigRoot = function ConfigRoot() {
    _classCallCheck(this, ConfigRoot);

    this.cache = new _ConfigCache2.default();
    this.transform = new _ConfigTransform2.default();
    this.data = new _ConfigData2.default();
};

exports.default = ConfigRoot;
//# sourceMappingURL=ConfigRoot.js.map