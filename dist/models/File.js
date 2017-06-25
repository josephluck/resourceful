'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var File = function File(name, contents) {
    _classCallCheck(this, File);

    this.name = name || '';
    this.contents = contents || '';

    Object.seal(this);
};

exports.default = File;
//# sourceMappingURL=File.js.map