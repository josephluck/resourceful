'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ConfigBase = function ConfigBase() {
    _classCallCheck(this, ConfigBase);

    this.enableCache = true;
    this.primaryKey = '';
    this.secondaryKeys = [];
    this.transformResponse = null;
    this.transformEntry = null;
    this.transformError = null;
    this.Model = null;
};

exports.default = ConfigBase;
//# sourceMappingURL=ConfigBase.js.map