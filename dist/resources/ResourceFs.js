'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _ResourceBase2 = require('./ResourceBase');

var _ResourceBase3 = _interopRequireDefault(_ResourceBase2);

var _ConfigRoot2 = require('../config/ConfigRoot');

var _ConfigRoot3 = _interopRequireDefault(_ConfigRoot2);

var _ConfigFs = require('../config/ConfigFs');

var _ConfigFs2 = _interopRequireDefault(_ConfigFs);

var _IResource2 = require('../interfaces/IResource');

var _IResource3 = _interopRequireDefault(_IResource2);

var _File = require('../models/File');

var _File2 = _interopRequireDefault(_File);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ResourceFs = function (_IResource) {
    _inherits(ResourceFs, _IResource);

    function ResourceFs() {
        _classCallCheck(this, ResourceFs);

        return _possibleConstructorReturn(this, (ResourceFs.__proto__ || Object.getPrototypeOf(ResourceFs)).apply(this, arguments));
    }

    return ResourceFs;
}(_IResource3.default);

var Config = function (_ConfigRoot) {
    _inherits(Config, _ConfigRoot);

    function Config() {
        _classCallCheck(this, Config);

        var _this2 = _possibleConstructorReturn(this, (Config.__proto__ || Object.getPrototypeOf(Config)).call(this));

        _this2.fs = new _ConfigFs2.default();

        Object.seal(_this2);
        return _this2;
    }

    return Config;
}(_ConfigRoot3.default);

ResourceFs.Implementation = function (_ResourceBase) {
    _inherits(_class, _ResourceBase);

    function _class(config) {
        _classCallCheck(this, _class);

        var _this3 = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

        _this3.configure(config, Config);

        if (!config.fs.extension) {
            throw new Error('[resource-fs] No file extension specified');
        }

        if (config.fs.extension.charAt(0) !== '.') {
            config.fs.extension = '.' + config.fs.extension;
        }

        _this3.root = _path2.default.resolve(_this3.config.fs.path);

        Object.seal(_this3);
        return _this3;
    }

    /**
     * Implements the service call for this type of resource.
     *
     * @private
     * @param   {object} query
     * @return  {object[]}
     */

    _createClass(_class, [{
        key: 'queryService',
        value: function queryService() {
            var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var nameKey = this.config.fs.nameKey;

            var hasQuery = false;
            var transform = null;
            var name = '';

            if (typeof (transform = this.config.transform.query) === 'function') {
                query = transform(query);
            }

            hasQuery = Object.keys(query).length;

            if (hasQuery && typeof query.name === 'undefined') {
                if (nameKey && (name = query[nameKey])) {
                    // Create new nameKeyed query to preserve cache keys

                    query = { name: name };
                } else {
                    throw new Error('[resource-fs] Files may only be queried by `name`. Please provide a name key.');
                }
            }

            if (hasQuery) {
                return this.getFilesByName(query);
            }

            return this.getAllFiles();
        }

        /**
         * @private
         * @param   {object} query
         * @return  {Promise}
         */

    }, {
        key: 'getFilesByName',
        value: function getFilesByName(query) {
            var names = query.name;

            if (!Array.isArray(names)) {
                names = [names];
            }

            return Promise.all(names.map(this.getFileByName.bind(this)));
        }

        /**
         * @private
         * @param   {string} name
         * @return  {Promise}
         */

    }, {
        key: 'getFileByName',
        value: function getFileByName(name) {
            var _this4 = this;

            var extRe = new RegExp(this.config.fs.extension + '$', 'g');

            if (name.match(extRe)) {
                // Strip extension from filename is present

                name = name.replace(extRe, '');
            }

            var filePath = _path2.default.join(this.root, name + this.config.fs.extension);

            return new Promise(function (resolve, reject) {
                _fsExtra2.default.readFile(filePath, function (err, data) {
                    return err ? reject(err) : resolve(data);
                });
            }).then(function (buffer) {
                return new _File2.default(name, buffer.toString());
            }).then(function (file) {
                if (_this4.config.fs.extension !== '.json') return file;

                return JSON.parse(file.contents);
            }).then(function (file) {
                return _this4.transformResponse(file);
            });
        }

        /**
         * @private
         * @return  {Promise}
         */

    }, {
        key: 'getAllFiles',
        value: function getAllFiles() {
            var _this5 = this;

            return new Promise(function (resolve, reject) {
                _fsExtra2.default.readdir(_this5.root, function (err, list) {
                    return err ? reject(err) : resolve(list);
                });
            }).then(function (list) {
                // Filter out system files and files not matching the
                // specified extension

                return list.filter(function (fileName) {
                    return fileName.match(/^[^.]/g) && fileName.match(new RegExp(_this5.config.fs.extension + '$', 'g'));
                });
            }).then(function (filenames) {
                return Promise.all(filenames.map(_this5.getFileByName.bind(_this5)));
            });
        }
    }]);

    return _class;
}(_ResourceBase3.default);

exports.default = ResourceFs;
//# sourceMappingURL=ResourceFs.js.map