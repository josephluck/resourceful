var ResourceBase = require('./resource-base');

var ResourceXhr = function() {
    var args = Array.prototype.concat.apply([null], arguments);
    var _    = new (ResourceXhr.Private.bind.apply(ResourceXhr.Private, args))();

    this.get            = _.get.bind(_);
    this.getOne         = _.getOne.bind(_);
    this.create         = _.create.bind(_);
    this.update         = _.update.bind(_);
    this.delete         = _.delete.bind(_);
    this.flushResource  = _.flushResource.bind(_);
    this.flushCache     = _.flushCache.bind(_);

    Object.seal(this);
};

ResourceXhr.Private = function() {
    ResourceBase.apply(this, arguments);

    this.config = new ResourceXhr.Config();

    Object.seal(this);

    this.init.apply(this, arguments);
};

ResourceXhr.Private.prototype = Object.create(ResourceBase.prototype);

Object.assign(ResourceXhr.Private.prototype, {
    constructor: ResourceXhr.Private,

    get: function(query) {
        var self      = this;
        var wasCached = false;

        return Promise.resolve()
            .then(function() {
                var resources = [];

                if (self.config.enableCache) {
                    // Find resources already in the cache

                    resources = self.readFromCache(query);
                }

                if (resources) {
                    wasCached = true;

                    return resources;
                } else {
                    return ResourceXhr.xhr('get', self.config.path, query)
                        .then(function(response) {
                            return self.transformResponse(response);
                        })
                        .then(function(resources) {
                            if (!Array.isArray(resources)) {
                                throw new Error('[resource-xhr] Invalid resources array');
                            }

                            return resources;
                        });
                }
            })
            .then(function(resources) {
                if (self.config.enableCache && !wasCached) {
                    self.writeToCache(query, resources);

                    resources = self.readFromCache(query);
                }

                return resources;
            });
    },

    create: function(body) {
        var self = this;

        return ResourceXhr.xhr('post', self.config.path, body)
            .then(self.transformResponse.bind(self));
    },

    update: function(body) {
        var self = this;

        self.flushCache();

        return ResourceXhr.xhr('put', self.config.path, body)
            .then(self.transformResponse.bind(self));
    },

    delete: function(query) {
        var self = this;

        self.flushCache();

        return ResourceXhr.xhr('delete', self.config.path, query)
            .then(self.transformResponse.bind(self));
    },

    transformResponse: function(response) {
        var self = this;

        return Promise.resolve()
            .then(function() {
                if (typeof self.config.transformResponse === 'function') {
                    return self.config.transformResponse(response);
                }

                return response;
            });
    }
});

ResourceXhr.xhr = function(method, path, data) {
    var request = new window.XMLHttpRequest();
    var payload = null;

    return Promise.resolve()
        .then(function() {
            switch (method) {
                case 'get':
                case 'delete':
                    path = path + ResourceXhr.serializeQuery(data);

                    break;
                case 'put':
                case 'post':
                    payload = data;
            }

            request.open(method, path, true);

            if (payload) {
                request.setRequestHeader('Content-Type', 'application/json');
            }

            request.timeout = 10000;

            return new Promise(function(resolve, reject) {
                request.onload      = resolve;
                request.onerror     = reject;
                request.ontimeout   = reject;

                request.send(payload ? JSON.stringify(payload) : '');
            });
        })
        .then(function() {
            var response = {};

            try {
                response = JSON.parse(request.response);
            } catch(e) {}

            if (request.status >= 400) {
                throw response;
            }

            return response;
        });
};

/**
 * @param   {object} query
 * @return  {string}
 *
 * Takes a query object and returns a serialized query string.
 * Handles arrays by adding multiple occurences of the same key.
 */

ResourceXhr.serializeQuery = function(query) {
    var queries     = [];
    var queryString = '';
    var value       = '';
    var prop        = '';
    var item        = '';
    var i           = -1;

    for (prop in query) {
        value = query[prop];

        // Convert all query parameters to 'snake_case'

        prop = prop.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();

        if (Array.isArray(value)) {
            for (i = 0; item = value[i]; i++) {
                queries.push(encodeURIComponent(prop) + '=' + encodeURIComponent(item));
            }
        } else {
            queries.push(encodeURIComponent(prop) + '=' + encodeURIComponent(value));
        }
    }

    if (queries.length) {
        queryString = '?' + queries.join('&');
    }

    return queryString;
};

ResourceXhr.Config = function() {
    ResourceBase.ConfigBase.call(this);

    this.path               = '';
    this.transformResponse  = null;

    Object.seal(this);
};

module.exports = ResourceXhr;