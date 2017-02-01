'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _KeyCache = require('./KeyCache');

var _KeyCache2 = _interopRequireDefault(_KeyCache);

var _ValueCache = require('./ValueCache');

var _ValueCache2 = _interopRequireDefault(_ValueCache);

var _ConfigBase = require('./ConfigBase');

var _ConfigBase2 = _interopRequireDefault(_ConfigBase);

var _Util = require('./Util.js');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ResourceBase = function () {
    function ResourceBase() {
        _classCallCheck(this, ResourceBase);

        this.config = null;
        this.cache = new _KeyCache2.default();
        this.activeRequests = {};
    }

    /**
     * A short hand for `.get()[0]`, returning only the first entry.
     *
     * @public
     * @param   {object}    query
     * @param   {object}    [req=null]
     *     An optional object representing the request (i.e. ExpressRequest)
     * @return  {Promise.<object>}
     */

    _createClass(ResourceBase, [{
        key: 'getOne',
        value: function getOne(query) {
            var req = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            return this.get(query, req).then(function (entries) {
                return entries[0] || null;
            });
        }

        /**
         * Queries and returns one or more entries, either from the cache,
         * or from the integrated service (i.e. XHR, mongo, fs), writing
         * back into the cache when done.
         *
         * @public
         * @param   {object}    query
         * @param   {object}    [req=null]
         *     An optional object containing data about the request
         *     (i.e. ExpressRequest)
         * @return  {Promise.<object[]>}
         */

    }, {
        key: 'get',
        value: function get() {
            var _this = this;

            var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var req = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            var requestId = ResourceBase.getRequestId('get', query);

            var activeRequestPromise = null;
            var wasFoundInCache = false;

            if (typeof (activeRequestPromise = this.activeRequests[requestId]) !== 'undefined') {
                // If another idential request is already in progress, return a
                // reference to that request's promise

                return activeRequestPromise;
            }

            return this.activeRequests[requestId] = Promise.resolve().then(function () {
                var entries = null;

                if (_this.config.enableCache) {
                    entries = _this.readFromCache(query);
                }

                if (entries) {
                    // ^ Allows 0 results to be cached

                    wasFoundInCache = true;

                    return entries;
                }

                return _this.queryService(query);
            }).then(function (entries) {
                if (_this.config.enableCache && !wasFoundInCache) {
                    _this.writeToCache(query, entries);

                    entries = _this.readFromCache(query);
                }

                return Promise.all(entries.map(function (entry) {
                    return _this.transformEntry(entry, req);
                }));
            }).then(function (entries) {
                delete _this.activeRequests[requestId];

                return entries;
            });
        }

        /**
         * @public
         * @return {void}
         */

    }, {
        key: 'create',
        value: function create() {
            console.log('not implemented');
        }

        /**
         * @public
         * @return {void}
         */

    }, {
        key: 'update',
        value: function update() {
            console.log('not implemented');
        }

        /**
         * @public
         * @return {void}
         */

    }, {
        key: 'delete',
        value: function _delete() {
            console.log('not implemented');
        }

        /**
         * Queries and flushes an individual store by nullifying the reference.
         *
         * @public
         * @param   {object}
         * @return  {void}
         */

    }, {
        key: 'flushCacheStore',
        value: function flushCacheStore(query) {
            var store = this.getCacheStore(query);

            if (!store) return;

            // TODO: ensure secondary key references are also deleted

            store.$$parent$$.$$store$$ = null;
        }

        /**
         * Flushes the entire cache for the resource.
         *
         * @public
         * @return  {void}
         */

    }, {
        key: 'flushCache',
        value: function flushCache() {
            this.cache = new _KeyCache2.default();
        }

        /**
         * Configures the resource with a provided user defined
         * configuration object.
         *
         * @private
         * @param   {object}   config
         * @param   {function} ConfigModel
         * @return  {void}
         */

    }, {
        key: 'configure',
        value: function configure(config) {
            var ConfigModel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _ConfigBase2.default;

            this.config = new ConfigModel();

            if (!(this.config instanceof _ConfigBase2.default)) {
                throw new TypeError('[resource-base] Resource config must be an ancestor of `ConfigBase`');
            }

            _Util2.default.extend(this.config, config);
        }

        /**
         * @param   {*} err
         * @return  {*}
         */

    }, {
        key: 'transformError',
        value: function transformError(err) {
            if (typeof this.config.transformError === 'function') {
                throw this.config.transformError(err);
            }

            throw err;
        }

        /**
         * Passes a returned response through an optional "transform" function,
         * returning the transformed output before it is written to cache.
         *
         * @private
         * @param   {object[]} response
         * @return  {object[]}
         */

    }, {
        key: 'transformResponse',
        value: function transformResponse(response) {
            if (typeof this.config.transformResponse === 'function') {
                return this.config.transformResponse(response);
            }

            return response;
        }

        /**
         * Maps the entry into an optional model after it is retreived from the
         * cache, then calls an optional `transformEntry` function.
         *
         * @private
         * @param   {object}           entry
         * @param   {(object|null)}    req
         * @return  {Promise.<object>}
         */

    }, {
        key: 'transformEntry',
        value: function transformEntry(entry, req) {
            var _this2 = this;

            var model = null;

            return Promise.resolve().then(function () {
                if (typeof _this2.config.Model !== 'function') {
                    model = entry;

                    return;
                }

                model = new _this2.config.Model();

                _Util2.default.extend(model, entry, true);

                if (typeof model.init === 'function') {
                    return model.init();
                }
            }).then(function () {
                if (typeof _this2.config.transformEntry === 'function') {
                    return _this2.config.transformEntry(model, req);
                }

                return model;
            }).then(function (model) {
                if (typeof model === 'undefined') {
                    throw new Error('[ResourceBase] The provided `transformEntry()` function returned `undefined`');
                }

                return model;
            });
        }

        /**
         * Queries and returns a reference to an individual store.
         *
         * @private
         * @param   {object} query
         * @return  {(object[]|null)}
         */

    }, {
        key: 'readFromCache',
        value: function readFromCache(query) {
            var store = this.getCacheStore(query);

            return store;
        }

        /**
         * Queries a store and writes one or more entries to it.
         *
         * @private
         * @param   {object}      query
         * @param   {object[]}    entries
         * @return  {void}
         */

    }, {
        key: 'writeToCache',
        value: function writeToCache(query, entries) {
            var store = this.getCacheStore(query, true);
            var cacheBySecondaryKeys = this.config.secondaryKeys.length > 0;

            var primaryKeyValue = null;
            var cacheByPrimaryKey = false;

            if ((primaryKeyValue = query[this.config.primaryKey]) && Array.isArray(primaryKeyValue)) {
                cacheByPrimaryKey = true;
            }

            this.writeEntriesToStore(store, entries, cacheByPrimaryKey, cacheBySecondaryKeys);
        }

        /**
         * A generic method for retrieving a cache store via query,
         * optionally building the store if absent.
         *
         * @private
         * @param   {object}    query
         * @param   {boolean}   buildCache
         * @return  {object[]|null}
         */

    }, {
        key: 'getCacheStore',
        value: function getCacheStore(query) {
            var buildCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var keyCache = this.cache;
            var valueCache = null;
            var queryKeys = null;
            var key = '';
            var value = '';
            var i = -1;

            query = query || {};

            queryKeys = Object.keys(query);

            keyCache = this.cache;

            if (queryKeys.length < 1) {
                if (!keyCache.$$store$$ && buildCache) {
                    keyCache.$$store$$ = ResourceBase.buildFreshStore(keyCache);
                }

                return keyCache.$$store$$;
            }

            for (i = 0; i < queryKeys.length; i++) {
                key = queryKeys[i];

                if (Array.isArray(query[key])) {
                    // Coerce array queries to strings, but mark as array
                    // with quasi-array notation

                    value = '(' + query[key].toString() + ')[]';
                } else {
                    value = query[key];
                }

                valueCache = keyCache[key];

                if (!valueCache && buildCache) {
                    valueCache = keyCache[key] = new _ValueCache2.default();
                } else if (!valueCache) {
                    return null;
                }

                keyCache = valueCache[value];

                if (!keyCache && buildCache) {
                    keyCache = valueCache[value] = new _KeyCache2.default();

                    keyCache.$$parent$$ = valueCache;
                    keyCache.$$value$$ = value;
                } else if (!keyCache) {
                    return null;
                }

                if (i === queryKeys.length - 1) {
                    if (!keyCache.$$store$$ && buildCache) {
                        keyCache.$$store$$ = ResourceBase.buildFreshStore(keyCache);
                    }

                    return keyCache.$$store$$;
                }
            }
        }

        /**
         * Writes one or more entries to a store, optionally caching
         * them by their secondary keys if defined.
         *
         * @private
         * @param   {object[]}    store
         * @param   {object[]}    entries
         * @param   {boolean}     cacheByPrimaryKey
         *     This must be set explicitly to prevent infinite recursion
         * @param   {boolean}     cacheBySecondaryKeys
         *     This must be set explicitly to prevent infinite recursion
         * @return  {void}
         */

    }, {
        key: 'writeEntriesToStore',
        value: function writeEntriesToStore(store, entries) {
            var cacheByPrimaryKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
            var cacheBySecondaryKeys = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

            var entry = null;
            var altStore = null;
            var query = null;
            var key = '';
            var i = -1;
            var j = -1;

            if (store.length > 0) throw new Error('[resource-base] Store not empty');

            for (i = 0; entry = entries[i]; i++) {
                store.push(entry);

                if (cacheByPrimaryKey) {
                    var _query = {};

                    _query[this.config.primaryKey] = entry[this.config.primaryKey];

                    this.writeToCache(_query, [entry]);
                }

                if (!cacheBySecondaryKeys) continue;

                for (j = 0; j < this.config.secondaryKeys.length; j++) {
                    key = this.config.secondaryKeys[j];

                    if (typeof entry[key] === 'string') {
                        query = {};
                        query[key] = entry[key];

                        altStore = this.getCacheStore(query);

                        if (altStore.length < 1) {
                            this.writeEntriesToStore(altStore, [entry]);
                        }
                    }
                }
            }
        }

        /**
         * Instantiates a decorated array to act as the store, adding a circular
         * reference to the parent cache for nullification.
         *
         * @private
         * @static
         * @param   {KeyCache} keyCache
         * @return  {object[]}
         */

    }], [{
        key: 'buildFreshStore',
        value: function buildFreshStore(keyCache) {
            var store = [];

            Object.defineProperty(store, '$$parent$$', {
                get: function get() {
                    return keyCache;
                }
            });

            return store;
        }

        /**
         * @param   {('get'|'update'|'create'|'delete')}  type
         * @param   {object}                              data
         * @return  {string}
         */

    }, {
        key: 'getRequestId',
        value: function getRequestId(type, data) {
            var json = JSON.stringify(data);

            return type + '_' + json;
        }
    }]);

    return ResourceBase;
}();

exports.default = ResourceBase;
//# sourceMappingURL=ResourceBase.js.map