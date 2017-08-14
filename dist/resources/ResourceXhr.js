'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.serializeQuery = serializeQuery;
exports.xhr = xhr;

var _ResourceBase2 = require('./ResourceBase');

var _ResourceBase3 = _interopRequireDefault(_ResourceBase2);

var _ConfigRoot2 = require('../config/ConfigRoot');

var _ConfigRoot3 = _interopRequireDefault(_ConfigRoot2);

var _ConfigXhr = require('../config/ConfigXhr');

var _ConfigXhr2 = _interopRequireDefault(_ConfigXhr);

var _IResource2 = require('../interfaces/IResource');

var _IResource3 = _interopRequireDefault(_IResource2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ResourceXhr = function (_IResource) {
    _inherits(ResourceXhr, _IResource);

    function ResourceXhr() {
        _classCallCheck(this, ResourceXhr);

        return _possibleConstructorReturn(this, (ResourceXhr.__proto__ || Object.getPrototypeOf(ResourceXhr)).apply(this, arguments));
    }

    return ResourceXhr;
}(_IResource3.default);

var Config = function (_ConfigRoot) {
    _inherits(Config, _ConfigRoot);

    function Config() {
        _classCallCheck(this, Config);

        var _this2 = _possibleConstructorReturn(this, (Config.__proto__ || Object.getPrototypeOf(Config)).call(this));

        _this2.xhr = new _ConfigXhr2.default();

        Object.seal(_this2);
        return _this2;
    }

    return Config;
}(_ConfigRoot3.default);

ResourceXhr.Implementation = function (_ResourceBase) {
    _inherits(_class, _ResourceBase);

    function _class(config) {
        _classCallCheck(this, _class);

        var _this3 = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

        _this3.configure(config, Config);

        Object.seal(_this3);
        return _this3;
    }

    /**
     * @pulic
     * @param {object} body
     * @return {Promise.<*>}
     */

    _createClass(_class, [{
        key: 'create',
        value: function create(body) {
            return xhr('post', this.config.xhr.path, body).then(this.transformResponse.bind(this)).catch(this.transformError.bind(this));
        }

        /**
         * @pulic
         * @param {object} body
         * @return {Promise.<*>}
         */

    }, {
        key: 'update',
        value: function update(body) {
            this.flushCache();

            // TODO: iterate through primary key and secondary keys,
            // and use flushCacheStore instead of flushCache

            return xhr('put', this.config.xhr.path, body).then(this.transformResponse.bind(this)).catch(this.transformError.bind(this));
        }

        /**
         * @pulic
         * @param {object} query
         * @return {Promise.<*>}
         */

    }, {
        key: 'delete',
        value: function _delete(query) {
            this.flushCacheStore(query);

            // iterate through primary and secondary keys and flush secondary stores

            return xhr('delete', this.config.xhr.path, query).then(this.transformResponse.bind(this)).catch(this.transformError.bind(this));
        }

        /**
         * Implements the service call for this type of resource.
         *
         * @private
         * @param   {object}        query
         * @param   {(object|null)} req
         * @param   {(object|null)} res
         * @return  {object[]}
         */

    }, {
        key: 'queryService',
        value: function queryService(query, req, res) {
            var _this4 = this;

            return Promise.resolve().then(function () {
                var transform = null;

                if (typeof (transform = _this4.config.transform.query) === 'function') {
                    return transform(query, req, res);
                }

                return query;
            }).then(function (query) {
                if (!query) {
                    throw new TypeError('[ResourceXhr] `transform.query` function must return an object');
                }

                return xhr('get', _this4.config.xhr.path, query, _this4.config.xhr.timeout);
            }).then(function (response) {
                return _this4.transformResponse(response);
            }).then(function (entries) {
                if (!Array.isArray(entries)) {
                    throw new TypeError('[resource-xhr] Resource service must return an array');
                }

                return entries;
            }).catch(this.transformError.bind(this));
        }
    }]);

    return _class;
}(_ResourceBase3.default);

/**
 * Takes a query object and returns a serialized query string.
 * Handles arrays by adding multiple occurences of the same key.
 * Handles objects by adding square brackets on each side (allows one
 * level of nesting). Could be refactored to use recursion.
 *
 * @static
 * @public
 * @param   {object} query
 * @return  {string}
 */

function serializeQuery(query) {
    var queries = [];

    var queryString = '';

    for (var key in query) {
        var value = query[key];

        // Convert all query parameters to 'snake_case'

        key = encodeSnakeCaseUriComponent(key);

        if (Array.isArray(value)) {
            for (var i = 0, item; item = value[i]; i++) {
                queries.push(key + '=' + encodeURIComponent(item));
            }
        } else if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            for (var subKey in value) {
                var subValue = value[subKey];

                subKey = encodeSnakeCaseUriComponent(subKey);

                queries.push(key + '[' + subKey + ']=' + encodeURIComponent(subValue));
            }
        } else {
            queries.push(key + '=' + encodeURIComponent(value));
        }
    }

    if (queries.length) {
        queryString = '?' + queries.join('&');
    }

    return queryString;
}

/**
 * A promise-based wrapper for an XHR request.
 *
 * @static
 * @public
 * @param   {string}      method
 * @param   {string}      path
 * @param   {object}      data
 * @return  {Promise.<object>}
 */

function xhr(method, path, data) {
    var timeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 10000;

    var request = new window.XMLHttpRequest();
    var CODE_CLIENT_ERROR = 400;
    var CODE_SERVER_ERROR = 500;

    var payload = null;

    return Promise.resolve().then(function () {
        switch (method) {
            case 'get':
            case 'delete':
                path += serializeQuery(data);

                break;
            case 'put':
            case 'post':
                payload = data;

                break;
            default:
                throw new Error('[resource-xhr] Invalid XHR method');
        }

        request.open(method, path, true);

        if (payload) {
            request.setRequestHeader('Content-Type', 'application/json');
        }

        request.timeout = timeout;

        return new Promise(function (resolve, reject) {
            request.onload = resolve;
            request.onerror = reject;
            request.ontimeout = reject;

            request.send(payload ? JSON.stringify(payload) : '');
        });
    }).then(function () {
        var response = {};

        if (request.responseText) {
            try {
                response = JSON.parse(request.responseText);
            } catch (e) {
                throw new Error('[ResourceXhr] Response contained invalid JSON');
            }
        }

        if (request.status >= CODE_CLIENT_ERROR && request.status < CODE_SERVER_ERROR) {
            throw response;
        } else if (request.status >= CODE_SERVER_ERROR) {
            throw new Error(request.status);
        }

        return response;
    });
}

/**
 * @private
 * @static
 * @param  {string} input
 * @return {string}
 */

function encodeSnakeCaseUriComponent(input) {
    return encodeURIComponent(input).replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();
}

ResourceXhr.xhr = xhr;

exports.default = ResourceXhr;
//# sourceMappingURL=ResourceXhr.js.map