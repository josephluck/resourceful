'use strict';

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _chaiShallowDeepEqual = require('chai-shallow-deep-equal');

var _chaiShallowDeepEqual2 = _interopRequireDefault(_chaiShallowDeepEqual);

var _people = require('../tests/mock/people.json');

var _people2 = _interopRequireDefault(_people);

var _api = require('../tests/mock/api.js');

var _api2 = _interopRequireDefault(_api);

var _ResourceBase = require('./ResourceBase.js');

var _ResourceBase2 = _interopRequireDefault(_ResourceBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_chai2.default.use(_chaiShallowDeepEqual2.default);

describe('ResourceBase', function () {
    var resource = new _ResourceBase2.default();
    var api = new _api2.default(_people2.default);

    resource.configure({
        primaryKey: 'id',
        enableCache: true
    });

    resource.queryService = api.get.bind(api);

    it('should return a full dataset if no query object passed', function () {
        return resource.get().then(function (entries) {
            _chai2.default.assert.deepEqual(entries, _people2.default);
        });
    });

    it('it should load items into the cache, in a root store if no query passed', function () {
        _chai2.default.assert.deepEqual(resource.cache.$$store$$, _people2.default);
    });

    it('should not hit the cache if queried again', function () {
        var wasCalled = false;

        resource.queryService = function (query) {
            wasCalled = true;

            return api.get(query);
        };

        return resource.get().then(function (entries) {
            _chai2.default.assert.deepEqual(entries, _people2.default);
            _chai2.default.assert.equal(wasCalled, false);
        });
    });

    it('should return a subset if queried by key/value', function () {
        return resource.get({
            role: 'Developer'
        }).then(function (entries) {
            _chai2.default.assert.equal(entries.length, 3);
        });
    });

    it('should load multiple items into a key/value cache if queried', function () {
        _chai2.default.assert.isOk(resource.cache.role);
        _chai2.default.assert.isOk(resource.cache.role.Developer);
        _chai2.default.assert.isOk(resource.cache.role.Developer.$$store$$);
        _chai2.default.assert.equal(resource.cache.role.Developer.$$store$$.length, 3);
    });

    it('should not hit the cache if queried again', function () {
        var wasCalled = false;

        resource.queryService = function (query) {
            wasCalled = true;

            return api.get(query);
        };

        return resource.get({
            role: 'Developer'
        }).then(function (entries) {
            _chai2.default.assert.equal(entries.length, 3);
            _chai2.default.assert.equal(wasCalled, false);
        });
    });

    it('should flush the root store if no query passed to `flushCacheStore()`', function () {
        resource.flushCacheStore();

        _chai2.default.assert.equal(resource.cache.$$store$$, null);
    });

    it('should flush a key/value store if query passed to `flushCacheStore()`', function () {
        resource.flushCacheStore({
            role: 'Developer'
        });

        _chai2.default.assert.equal(resource.cache.role.Developer.$$store$$, null);
    });
});
//# sourceMappingURL=ResourceBase.tests.js.map