'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mongoose = require('mongoose');

var _ResourceBase2 = require('./ResourceBase');

var _ResourceBase3 = _interopRequireDefault(_ResourceBase2);

var _ConfigRoot2 = require('../config/ConfigRoot');

var _ConfigRoot3 = _interopRequireDefault(_ConfigRoot2);

var _ConfigMongoose = require('../config/ConfigMongoose');

var _ConfigMongoose2 = _interopRequireDefault(_ConfigMongoose);

var _IResource2 = require('../interfaces/IResource');

var _IResource3 = _interopRequireDefault(_IResource2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ResourceMongoose = function (_IResource) {
    _inherits(ResourceMongoose, _IResource);

    function ResourceMongoose() {
        _classCallCheck(this, ResourceMongoose);

        return _possibleConstructorReturn(this, (ResourceMongoose.__proto__ || Object.getPrototypeOf(ResourceMongoose)).apply(this, arguments));
    }

    return ResourceMongoose;
}(_IResource3.default);

var Config = function (_ConfigRoot) {
    _inherits(Config, _ConfigRoot);

    function Config() {
        _classCallCheck(this, Config);

        var _this2 = _possibleConstructorReturn(this, (Config.__proto__ || Object.getPrototypeOf(Config)).call(this));

        _this2.mongoose = new _ConfigMongoose2.default();

        Object.seal(_this2);
        return _this2;
    }

    return Config;
}(_ConfigRoot3.default);

var ObjectId = _mongoose.Types.ObjectId;


ResourceMongoose.Implementation = function (_ResourceBase) {
    _inherits(_class, _ResourceBase);

    function _class(config) {
        _classCallCheck(this, _class);

        var _this3 = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

        _this3.configure(config, Config);

        Object.seal(_this3);
        return _this3;
    }

    /**
     * Implements the service call for this type of resource.
     *
     * @private
     * @param   {object} query
     * @param   {(object|null)} req
     * @param   {(object|null)} res
     * @return  {object[]}
     */

    _createClass(_class, [{
        key: 'queryService',
        value: function queryService() {
            var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var _this4 = this;

            var req = arguments[1];
            var res = arguments[2];

            return Promise.resolve().then(function () {
                var transform = null;

                if (typeof (transform = _this4.config.transform.query) === 'function') {
                    return transform(query, req, res);
                }

                return query;
            }).then(function (query) {
                if (!query) {
                    throw new TypeError('[ResourceMongoose] `transform.query` function must return an object');
                }

                var dbQuery = constructMongoQuery(query);

                var $page = 1;
                var $offset = 0;
                var $limit = 100;
                var $sort = '';

                if (query.$limit && query.$page) {
                    $page = parseInt(query.$page);
                    $limit = parseInt(query.$limit);

                    if ($limit < Infinity) {
                        $offset = $limit * ($page - 1);
                    }

                    $sort = '-_id';
                } else if (query.$limit && typeof query.$offset === 'number') {
                    $limit = query.$limit;
                    $offset = query.$offset;
                }

                if (!Object.keys(query).length) {
                    $sort = '-_id';
                }

                return _this4.config.mongoose.Model.find(dbQuery, '-__v').sort($sort).skip($offset).limit($limit).populate(_this4.config.mongoose.populate).then(function (documents) {
                    return documents.map(transformDocumentToPlainObject);
                });
            });
        }

        /**
         * @public
         * @param   {object} payload
         * @return  {Promise<object>}
         */

    }, {
        key: 'create',
        value: function create(payload) {
            var doc = new this.config.mongoose.Model(payload);

            return doc.save().then(transformDocumentToPlainObject);
        }

        /**
         * @public
         * @param   {object}    query
         * @param   {object}    payload
         * @param   {object}   [options={}]
         * @return  {Promise}
         */

    }, {
        key: 'update',
        value: function update(query, payload) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            var dbQuery = constructMongoQuery(query);

            return this.config.mongoose.Model.findOneAndUpdate(dbQuery, payload, options).then(function (document) {
                return document ? transformDocumentToPlainObject(document) : null;
            });
        }

        /**
         * @public
         * @param   {object}    query
         * @return  {Promise}
         */

    }, {
        key: 'delete',
        value: function _delete(query) {
            var _this5 = this;

            var dbQuery = constructMongoQuery(query);

            var doc = null;

            return this.config.mongoose.Model.findOne(dbQuery, '-__v').then(function (_doc) {
                doc = _doc;

                return _this5.config.mongoose.Model.findOneAndRemove(dbQuery);
            }).then(function () {
                return transformDocumentToPlainObject(doc);
            });
        }
    }]);

    return _class;
}(_ResourceBase3.default);

/**
 * @private
 * @static
 * @param   {object}    query
 * @return  {object}
 */

function constructMongoQuery(query) {
    var dbQuery = {};

    for (var key in query) {
        var value = query[key];

        if (Array.isArray(value)) {
            value = {
                $in: value
            };
        }

        if (key === 'id') {
            // Rename id to _id if present in query

            dbQuery['_id'] = value;
        } else {
            dbQuery[key] = value;
        }
    }

    delete dbQuery.$limit;
    delete dbQuery.$offset;
    delete dbQuery.$page;
    delete dbQuery.$sort;

    return dbQuery;
}

/**
 * @private
 * @static
 * @param   {Document} document
 * @return  {object}
 */

function transformDocumentToPlainObject(document) {
    var obj = document.toObject({
        virtuals: true
    });

    delete obj._id;
    delete obj.__v;

    stripMongoCruft(obj);

    return obj;
}

/**
 * Converts any MongDB types to strings.
 *
 * @private
 * @param {object} obj
 */

function stripMongoCruft(obj) {
    for (var key in obj) {
        var value = obj[key];

        if (!value) continue;

        if (value instanceof ObjectId) {
            obj[key] = value.toString();
        } else if (value instanceof Date) {
            obj[key] = value.toISOString();
        } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            stripMongoCruft(value);
        }
    }
}

exports.default = ResourceMongoose;
//# sourceMappingURL=ResourceMongoose.js.map