import ResourceBase from './ResourceBase';
import ConfigXhr    from './ConfigXhr';
import IResource    from './IResource';

class ResourceXhr extends IResource {
    constructor() {
        super(...arguments);
    }

    /**
     * Takes a query object and returns a serialized query string.
     * Handles arrays by adding multiple occurences of the same key.
     *
     * @static
     * @public
     * @param   {object} query
     * @return  {string}
     */

    static serializeQuery(query) {
        const queries = [];

        let queryString = '';

        for (let prop in query) {
            let value = query[prop];

            // Convert all query parameters to 'snake_case'

            prop = prop
                .replace(/([A-Z])/g, '_$1').replace(/^_/, '')
                .toLowerCase();

            if (Array.isArray(value)) {
                for (let i = 0, item; (item = value[i]); i++) {
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

    static xhr(method, path, data) {
        const request = new window.XMLHttpRequest();
        const ERROR_CODE_SERVER = 400;

        let payload = null;

        return Promise.resolve()
            .then(() => {
                switch (method) {
                    case 'get':
                    case 'delete':
                        path += ResourceXhr.serializeQuery(data);

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

                request.timeout = 60000;

                return new Promise((resolve, reject) => {
                    request.onload      = resolve;
                    request.onerror     = reject;
                    request.ontimeout   = reject;

                    request.send(payload ? JSON.stringify(payload) : '');
                });
            })
            .then(() => {
                let response = {};

                if (request.response) {
                    try {
                        response = JSON.parse(request.response);
                    } catch (e) {
                        throw new Error('[ResourceXhr] Response contained invalid JSON');
                    }
                }

                if (request.status >= ERROR_CODE_SERVER) {
                    throw new Error(request.status);
                }

                return response;
            });
    }
}

ResourceXhr.Private = class _ResourceXhr extends ResourceBase {
    constructor(config) {
        super();

        this.configure(config, ConfigXhr);
    }

    /**
     * @pulic
     * @param {object} body
     * @return {Promise.<*>}
     */

    create(body) {
        return ResourceXhr.xhr('post', this.config.path, body)
            .then(this.transformResponse.bind(this));
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

        return ResourceXhr.xhr('put', this.config.path, body)
            .then(this.transformResponse.bind(this));
    }

    /**
     * @pulic
     * @param {object} query
     * @return {Promise.<*>}
     */

    delete(query) {
        this.flushCacheStore(query);

        // iterate through primary and secondary keys and flush secondary stores

        return ResourceXhr.xhr('delete', this.config.path, query)
            .then(this.transformResponse.bind(this));
    }

    /**
     * Implements the service call for this type of resource.
     *
     * @private
     * @param   {object} query
     * @return  {object[]}
     */

    queryService(query) {
        return ResourceXhr.xhr('get', this.config.path, query)
            .then(response => this.transformResponse(response))
            .then(entries => {
                if (!Array.isArray(entries)) {
                    throw new TypeError('[resource-xhr] Resource service must return an array');
                }

                return entries;
            });
    }
};

export default ResourceXhr;