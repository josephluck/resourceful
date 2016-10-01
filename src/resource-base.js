'use strict';

var ResourceBase = function() {
    this.name               = '';
    this.activeRequests     = {};
    this.resourceProvider   = null;
    this.config             = null;
    this.cache              = new ResourceBase.KeyCache();
};

ResourceBase.prototype = {
    constuctor: ResourceBase,

    /**
     * @public
     * @param   {string}    name
     * @param   {object}    config
     * @param   {object}    [resourceProvider]
     * @return  {void}
     */

    init: function(name, config, resourceProvider) {
        var self = this;

        Object.assign(self.config, config);

        if (!name || typeof name !== 'string') {
            throw new Error('[resource] A resource requires a name');
        }

        self.name = name;

        if (resourceProvider) {
            // Inject optional reference to resource provider

            self.resourceProvider = resourceProvider;
        }
    },

    /**
     * @public
     * @param   {object}    query
     * @param   {object}    [options]
     * @return  {Promise<object>}
     */

    getOne: function(query, options) {
        var self = this;

        return self.get(query, options)
            .then(function(resources) {
                return resources[0] || null;
            });
    },

    /**
     * @public
     * @param   {object}    query
     * @return  {object[]|null}
     */

    readFromCache: function(query) {
        var self    = this;
        var store   = null;

        store = self.getCacheStore(query);

        return store;
    },

    /**
     * @public
     * @param   {query}       object
     * @param   {object[]}    resources
     * @return  {void}
     */

    writeToCache: function(query, resources) {
        var self = this;
        var store = null;

        store = self.getCacheStore(query, true);

        self.writeResourcesToStore(store, resources);
    },

    /**
     * @public
     * @param   {object}    query
     * @return  {void}
     */

    flushResource: function(query) {
        var self  = this;
        var store = self.getCacheStore(query, true);

        store.length = 0;
    },

    /**
     * @public
     * @return {void}
     */

    flushCache: function() {
        var self = this;

        self.cache = new ResourceBase.KeyCache();
    },

    /**
     * @private
     * @param   {object}    query
     * @param   {boolean}   [buildCache]
     * @return  {Object[]|null}
     */

    getCacheStore: function(query, buildCache) {
        var self        = this;
        var keyCache    = self.cache;
        var valueCache  = null;
        var queryKeys   = null;
        var key         = '';
        var value       = '';
        var i           = -1;

        query = query || {};

        queryKeys = Object.keys(query);

        keyCache = self.cache;

        if (queryKeys.length < 1) {
            if (!keyCache.$$store$$ && buildCache) {
                keyCache.$$store$$ = [];
            }

            return keyCache.$$store$$;
        }

        for (i = 0; i < queryKeys.length; i++) {
            key     = queryKeys[i];
            value   = query[key];

            valueCache = keyCache[key];

            if (!valueCache && buildCache) {
                valueCache = (keyCache[key] = new ResourceBase.ValueCache());
            } else if (!valueCache) {
                return null;
            }

            keyCache = valueCache[value];

            if (!keyCache && buildCache) {
                keyCache = (valueCache[value] = new ResourceBase.KeyCache());
            } else if (!keyCache) {
                return null;
            }

            if (i === queryKeys.length - 1) {
                if (!keyCache.$$store$$ && buildCache) {
                    keyCache.$$store$$ = [];
                }

                return keyCache.$$store$$;
            }
        }
    },

    /**
     * @private
     * @param   {object[]}    store
     * @return  {void}
     */

    writeResourcesToStore: function(store, resources) {
        var self        = this;
        var resource    = null;
        var altStore    = null;
        var i           = -1;

        if (store.length > 0) throw new Error('[resource-base] Store not empty');

        for (i = 0; resource = resources[i]; i++) {
            store.push(resource);

            // TODO: Parse user-defined list of secondary cache keys (e.g. slug, contentTypeSlug)

            if (typeof resource.id === 'string') {
                altStore = self.getCacheStore({
                    id: resource.id
                }, true);

                if (altStore.length < 1) {
                    self.writeResourcesToStore(altStore, [resource]);
                }
            }
        }
    }
};

ResourceBase.KeyCache = function() {
    this.$$store$$ = null;
};

ResourceBase.ValueCache = function() {};

ResourceBase.ConfigBase = function() {
    this.enableCache = true;
};

/**
 * @param   {*[]}
 * @return  {string}
 */

ResourceBase.getRequestId = function(args) {
    var arg     = null;
    var output  = '';
    var i       = -1;

    args = Array.prototype.slice.call(args);

    for (i = 0; i < args.length; i++) {
        arg = args[i];

        if (!arg) break;

        if (typeof arg === 'object') {
            try {
                output += JSON.stringify(arg || {});
            } catch(e) {
                output += arg.toString();
            }
        } else {
            output += arg.toString();
        }
    }

    if (typeof window === 'undefined') {
        output = new Buffer(output).toString('base64');
    } else {
        output = window.btoa(output);
    }

    return output;
};

module.exports = ResourceBase;