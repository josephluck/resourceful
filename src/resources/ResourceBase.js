import KeyCache    from '../models/KeyCache';
import ValueCache  from '../models/ValueCache';
import ConfigRoot  from '../config/ConfigRoot';
import Util        from '../Util.js';

class ResourceBase {
    constructor() {
        this.hasInitialized = false;
        this.config         = null;
        this.cache          = new KeyCache();
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

    getOne(query, req=null) {
        return this.get(query, req)
            .then(entries => {
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

    get(query={}, req=null) {
        const requestId = ResourceBase.getRequestId('get', query);

        let activeRequestPromise = null;
        let wasFoundInCache      = false;

        if (typeof (activeRequestPromise = this.activeRequests[requestId]) !== 'undefined') {
            // If another identical request is already in progress, return a
            // reference to that request's promise

            return activeRequestPromise;
        }

        return (this.activeRequests[requestId] = (
            Promise.resolve()
                .then(() => {
                    let entries = null;

                    if (this.config.cache.enable) {
                        entries = this.readFromCache(query);
                    }

                    if (entries) {
                        // ^ Allows 0 results to be cached

                        wasFoundInCache = true;

                        return entries;
                    }

                    if (this.config.data.init && !this.hasInitialized) {
                        return this.config.data.init;
                    }

                    return this.queryService(query);
                })
                .then(entries => {
                    this.hasInitialized = true;

                    if (this.config.cache.enable && !wasFoundInCache) {
                        this.writeToCache(query, entries);

                        entries = this.readFromCache(query);
                    }

                    return Promise.all(entries.map(entry => this.transformEntry(entry, req)));
                })
                .then(entries => {
                    delete this.activeRequests[requestId];

                    return entries;
                })
            )
        );
    }

    /**
     * @public
     * @return {void}
     */

    create() {
        console.log('not implemented');
    }

    /**
     * @public
     * @return {void}
     */

    update() {
        console.log('not implemented');
    }

    /**
     * @public
     * @return {void}
     */

    delete() {
        console.log('not implemented');
    }

    /**
     * Queries and flushes an individual store by nullifying the reference.
     *
     * @public
     * @param   {object}
     * @return  {void}
     */

    flushCacheStore(query) {
        const store = this.getCacheStore(query);

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

    flushCache() {
        this.cache = new KeyCache();
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

    configure(config, ConfigModel=ConfigRoot) {
        this.config = new ConfigModel();

        Object.seal(this.config);

        if (!(this.config instanceof ConfigRoot)) {
            throw new TypeError('[resource-base] Resource config must be an ancestor of `ConfigBase`');
        }

        Util.extend(this.config, config, true);
    }

    /**
     * @param   {*} err
     * @return  {*}
     */

    transformError(err) {
        let transform = null;

        if (typeof (transform = this.config.transform.error) === 'function') {
            throw transform(err);
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

    transformResponse(response) {
        let transform = null;

        if (typeof (transform = this.config.transform.response) === 'function') {
            return transform(response);
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

    transformEntry(entry, req) {
        let model = null;

        return Promise.resolve()
            .then(() => {
                let Model = null;

                if (typeof (Model = this.config.data.Model) !== 'function') {
                    model = entry;

                    return;
                }

                model = new Model();

                Util.extend(model, entry, true);

                if (typeof model.init === 'function') {
                    return model.init();
                }
            })
            .then(() => {
                let transform = null;

                if (typeof (transform = this.config.transform.entry) === 'function') {
                    return transform(model, req);
                }

                return model;
            })
            .then(model => {
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

    readFromCache(query) {
        const store = this.getCacheStore(query);

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

    writeToCache(query, entries) {
        const store                 = this.getCacheStore(query, true);
        const cacheBySecondaryKeys  = this.config.cache.secondaryKeys.length > 0;

        let primaryKeyValue = null;
        let cacheByPrimaryKey = false;

        if ((primaryKeyValue = query[this.config.cache.primaryKey]) && Array.isArray(primaryKeyValue)) {
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

    getCacheStore(query, buildCache=false) {
        let keyCache    = this.cache;
        let valueCache  = null;
        let queryKeys   = null;
        let key         = '';
        let value       = '';
        let i           = -1;

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
                valueCache = (keyCache[key] = new ValueCache());
            } else if (!valueCache) {
                return null;
            }

            keyCache = valueCache[value];

            if (!keyCache && buildCache) {
                keyCache = (valueCache[value] = new KeyCache());

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

    writeEntriesToStore(store, entries, cacheByPrimaryKey=false, cacheBySecondaryKeys=false) {
        let entry    = null;
        let altStore = null;
        let query    = null;
        let key      = '';
        let i        = -1;
        let j        = -1;

        if (store.length > 0) throw new Error('[resource-base] Store not empty');

        for (i = 0; (entry = entries[i]); i++) {
            store.push(entry);

            if (cacheByPrimaryKey) {
                let query = {};

                query[this.config.cache.primaryKey] = entry[this.config.cache.primaryKey];

                this.writeToCache(query, [entry]);
            }

            if (!cacheBySecondaryKeys) continue;

            for (j = 0; j < this.config.cache.secondaryKeys.length; j++) {
                key = this.config.cache.secondaryKeys[j];

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

    static buildFreshStore(keyCache) {
        const store = [];

        Object.defineProperty(store, '$$parent$$', {
            get() {
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

    static getRequestId(type, data) {
        const json = JSON.stringify(data);

        return type + '_' + json;
    }
}

export default ResourceBase;