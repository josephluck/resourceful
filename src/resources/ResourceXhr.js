import ResourceBase from './ResourceBase';
import ConfigRoot   from '../config/ConfigRoot';
import ConfigXhr    from '../config/ConfigXhr';
import IResource    from '../interfaces/IResource';

class ResourceXhr extends IResource {}

class Config extends ConfigRoot {
    constructor() {
        super();

        this.xhr = new ConfigXhr();

        Object.seal(this);
    }
}

ResourceXhr.Implementation = class extends ResourceBase {
    constructor(config) {
        super();

        this.configure(config, Config);

        Object.seal(this);
    }

    /**
     * @pulic
     * @param {object} body
     * @return {Promise.<*>}
     */

    create(body) {
        return xhr('post', this.config.xhr.path, body)
            .then(this.transformResponse.bind(this))
            .catch(this.transformError.bind(this));
    }

    /**
     * @pulic
     * @param {object} body
     * @return {Promise.<*>}
     */

    update(body) {
        this.flushCache();

        // TODO: iterate through primary key and secondary keys,
        // and use flushCacheStore instead of flushCache

        return xhr('put', this.config.xhr.path, body)
            .then(this.transformResponse.bind(this))
            .catch(this.transformError.bind(this));
    }

    /**
     * @pulic
     * @param {object} query
     * @return {Promise.<*>}
     */

    delete(query) {
        this.flushCacheStore(query);

        // iterate through primary and secondary keys and flush secondary stores

        return xhr('delete', this.config.xhr.path, query)
            .then(this.transformResponse.bind(this))
            .catch(this.transformError.bind(this));
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

    queryService(query, req, res) {
        return Promise.resolve()
            .then(() => {
                let transform = null;

                if (typeof (transform = this.config.transform.query) === 'function') {
                    return transform(query, req, res);
                }

                return query;
            })
            .then(query => {
                if (!query) {
                    throw new TypeError('[ResourceXhr] `transform.query` function must return an object');
                }

                return xhr('get', this.config.xhr.path, query, this.config.xhr.timeout);
            })
            .then(response => this.transformResponse(response))
            .then(entries => {
                if (!Array.isArray(entries)) {
                    throw new TypeError('[resource-xhr] Resource service must return an array');
                }

                return entries;
            })
            .catch(this.transformError.bind(this));
    }
};

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

export function serializeQuery(query) {
    const queries = [];

    let queryString = '';

    for (let key in query) {
        const value = query[key];

        // Convert all query parameters to 'snake_case'

        key = encodeSnakeCaseUriComponent(key);

        if (Array.isArray(value)) {
            for (let i = 0, item; (item = value[i]); i++) {
                queries.push(key + '=' + encodeURIComponent(item));
            }
        } else if (value && typeof value === 'object') {
            for (let subKey in value) {
                const subValue = value[subKey];

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

export function xhr(method, path, data, timeout=10000) {
    const request = new window.XMLHttpRequest();
    const CODE_CLIENT_ERROR = 400;
    const CODE_SERVER_ERROR = 500;

    let payload = null;

    return Promise.resolve()
        .then(() => {
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

            return new Promise((resolve, reject) => {
                request.onload      = resolve;
                request.onerror     = reject;
                request.ontimeout   = reject;

                request.send(payload ? JSON.stringify(payload) : '');
            });
        })
        .then(() => {
            let response = {};

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
    return encodeURIComponent(input)
        .replace(/([A-Z])/g, '_$1')
        .replace(/^_/, '')
        .toLowerCase();
}

ResourceXhr.xhr = xhr;

export default ResourceXhr;