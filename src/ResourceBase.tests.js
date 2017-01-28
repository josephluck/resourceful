/* eslint-disable no-magic-numbers */

import chai         from 'chai';
import deepEqual    from 'chai-shallow-deep-equal';

import mockEntries  from '../tests/mock/people.json';
import Api          from '../tests/mock/api.js';
import ResourceBase from './ResourceBase.js';

chai.use(deepEqual);

describe('ResourceBase', function() {
    const resource      = new ResourceBase();
    const api           = new Api(mockEntries);

    resource.configure({
        primaryKey: 'id',
        enableCache: true
    });

    resource.queryService = api.get.bind(api);

    it('should return a full dataset if no query object passed', function() {
        return resource.get()
            .then(entries => {
                chai.assert.deepEqual(entries, mockEntries);
            });
    });

    it('it should load items into the cache, in a root store if no query passed', function() {
        chai.assert.deepEqual(resource.cache.$$store$$, mockEntries);
    });

    it('should not hit the cache if queried again', function() {
        let wasCalled = false;

        resource.queryService = function(query) {
            wasCalled = true;

            return api.get(query);
        };

        return resource.get()
            .then(entries => {
                chai.assert.deepEqual(entries, mockEntries);
                chai.assert.equal(wasCalled, false);
            });
    });

    it('should return a subset if queried by key/value', function() {
        return resource.get({
            role: 'Developer'
        })
            .then(entries => {
                chai.assert.equal(entries.length, 3);
            });
    });

    it('should load multiple items into a key/value cache if queried', function() {
        chai.assert.isOk(resource.cache.role);
        chai.assert.isOk(resource.cache.role.Developer);
        chai.assert.isOk(resource.cache.role.Developer.$$store$$);
        chai.assert.equal(resource.cache.role.Developer.$$store$$.length, 3);
    });

    it('should not hit the cache if queried again', function() {
        let wasCalled = false;

        resource.queryService = function(query) {
            wasCalled = true;

            return api.get(query);
        };

        return resource.get({
            role: 'Developer'
        })
            .then(entries => {
                chai.assert.equal(entries.length, 3);
                chai.assert.equal(wasCalled, false);
            });
    });

    it('should flush the root store if no query passed to `flushCacheStore()`', function() {
        resource.flushCacheStore();

        chai.assert.equal(resource.cache.$$store$$, null);
    });

    it('should flush a key/value store if query passed to `flushCacheStore()`', function() {
        resource.flushCacheStore({
            role: 'Developer'
        });

        chai.assert.equal(resource.cache.role.Developer.$$store$$, null);
    });
});