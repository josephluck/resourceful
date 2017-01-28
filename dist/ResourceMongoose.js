"use strict";

/**
 * FIXME: Needs migrating over to new format
 */

// var ResourceBase = require('./resource-base');
// var ObjectId     = require('mongoose').Types.ObjectId;

// var ResourceMongoose = function() {
//     var args = Array.prototype.concat.apply([null], arguments);
//     var _    = new (ResourceMongoose.Private.bind.apply(ResourceMongoose.Private, args))();

//     this.getOne         = _.getOne.bind(_);
//     this.get            = _.get.bind(_);
//     this.create         = _.create.bind(_);
//     this.update         = _.update.bind(_);
//     this.delete         = _.delete.bind(_);
//     this.flushCache     = _.flushCache.bind(_);

//     Object.seal(this);
// };

// ResourceMongoose.Private = function() {
//     ResourceBase.apply(this, arguments);

//     this.config = new ResourceMongoose.Config();

//     Object.seal(this);

//     this.init.apply(this, arguments);
// };

// ResourceMongoose.Private.prototype = Object.create(ResourceBase.prototype);

// Object.assign(ResourceMongoose.Private.prototype, {
//     constructor: ResourceMongoose.Private,

//     /**
//      * @private
//      * @param   {object} [query]
//      * @return  {Promise<object[]>}
//      */

//     get: function(query) {
//         var self       = this;
//         var wasCached  = false;
//         var requestId  = '';

//         requestId = ResourceBase.getRequestId(arguments);

//         if (self.activeRequests[requestId]) {
//             // One or more identical requests already exists, return reference to original promise

//             return self.activeRequests[requestId];
//         }

//         return (self.activeRequests[requestId] = (Promise.resolve()
//             .then(function() {
//                 var resources       = null;
//                 var dbQuery         = null;
//                 var pageNumber      = 1;
//                 var entriesPerPage  = void(0);
//                 var startIndex      = 0;
//                 var sort            = '';

//                 // TODO: make DB-specifics configurable to resource - resource should be generic by default

//                 if (query && query.entriesPerPage) {
//                     // Set pagination instructions

//                     pageNumber      = parseInt(query.pageNumber);
//                     entriesPerPage  = parseInt(query.entriesPerPage);

//                     if (entriesPerPage < Infinity) {
//                         startIndex = entriesPerPage * (pageNumber - 1);
//                     }

//                     sort = '-_id';
//                 }

//                 if (!query || !Object.keys(query).length) {
//                     sort = '-_id';
//                 }

//                 if (self.config.enableCache) {
//                     // Find resources already in the cache

//                     resources = self.readFromCache(query);
//                 }

//                 if (resources) {
//                     wasCached = true;

//                     return resources;
//                 } else {
//                     dbQuery = self.constructMongoQuery(query);

//                     return self.config.Model.find(dbQuery, '-__v')
//                         .sort(sort)
//                         .skip(startIndex)
//                         .limit(entriesPerPage)
//                         .populate(self.config.populate)
//                         .then(function(documents) {
//                             return Promise.all(documents.map(function(document) {
//                                 var args = Array.prototype.slice.call(arguments, 1);

//                                 args.unshift(document);

//                                 return self.transformDocument.apply(self, args);
//                             }));
//                         });
//                 }
//             })
//             .then(function(resources) {
//                 delete self.activeRequests[requestId];

//                 if (self.config.enableCache && !wasCached) {
//                     self.writeToCache(query, resources);

//                     return self.readFromCache(query);
//                 } else {
//                     return resources;
//                 }
//             })));
//     },

//     /**
//      * @private
//      * @param   {object}    query
//      * @return  {object}
//      */

//     constructMongoQuery: function(query) {
//         var dbQuery = {};
//         var key     = '';
//         var value   = null;

//         for (key in query) {
//             value = query[key];

//             if (Array.isArray(value)) {
//                 value = {
//                     $in: value
//                 };
//             }

//             if (key === 'id') {
//                 // Rename id to _id if present in query

//                 dbQuery['_id'] = value;
//             } else {
//                 dbQuery[key] = value;
//             }
//         }

//         delete dbQuery.pageNumber;
//         delete dbQuery.entriesPerPage;

//         return dbQuery;
//     },

//     /**
//      * @private
//      * @param   {Document} document
//      * @return  {Promise<object>}
//      */

//     transformDocument: function(document) {
//         var self     = this;
//         var resource = null;
//         var args     = null;

//         return Promise.resolve()
//             .then(function() {
//                 args = Array.prototype.slice(arguments, 1);

//                 resource = document.toObject({
//                     virtuals: true
//                 });

//                 delete resource._id;
//                 delete resource.__v;

//                 self.stripMongoCruft(resource);
//             })
//             .then(function() {
//                 var model = null;

//                 if (typeof self.config.ViewModel === 'function') {
//                     model = new self.config.ViewModel();

//                     resource = Object.assign(model, resource);

//                     if (typeof model.init === 'function') {
//                         args.unshift(self.resourceProvider);

//                         return model.init.apply(model, args);
//                     }
//                 }
//             })
//             .then(function() {
//                 return resource;
//             });
//     },

//     /**
//      * Convert any Mongo ObjectId values to strings.
//      *
//      * @private
//      * @param {object} mongoObject
//      */

//     stripMongoCruft: function(mongoObject) {
//         var self    = this,
//             key     = null,
//             prop    = null;

//         for (key in mongoObject) {
//             prop = mongoObject[key];

//             if (!prop) continue;

//             if (prop instanceof ObjectId) {
//                 mongoObject[key] = prop.toString();
//             } else if (prop instanceof Date) {
//                 mongoObject[key] = prop.toISOString();
//             } else if (typeof prop === 'object') {
//                 self.stripMongoCruft(prop);
//             }
//         }
//     },

//     /**
//      * @param   {object} payload
//      * @return  {Promise<object>}
//      */

//     create: function(payload) {
//         var self        = this,
//             resource    = null;

//         resource = new self.config.Model(payload);

//         return resource.save()
//             .then(function(document) {
//                 return self.transformDocument(document);
//             });
//     },

//     /**
//      * @param   {object}    query
//      * @param   {object}    payload
//      * @param   {object}   [options]
//      * @return  {Promise}
//      */

//     update: function(query, payload, options) {
//         var self        = this,
//             dbQuery     = null;

//         options = options || {};

//         dbQuery = self.constructMongoQuery(query);

//         return self.config.Model.findOneAndUpdate(dbQuery, payload, {
//             upsert: options.upsert ? true : false
//         })
//             .then(function(document) {
//                 return self.transformDocument(document);
//             });
//     },

//     /**
//      * @param   {object}    query
//      * @param   {object}    [options]
//      * @return  {Promise}
//      */

//     delete: function(query, options) {
//         var self        = this;
//         var dbQuery     = null;
//         var document    = null;

//         options = options || {};

//         dbQuery = self.constructMongoQuery(query);

//         return self.config.Model.findOne(dbQuery, '-__v')
//             .then(function(_document) {
//                 document = _document;

//                 return self.config.Model.findOneAndRemove(dbQuery);
//             })
//             .then(function() {
//                 return self.transformDocument(document);
//             });
//     }
// });

// ResourceMongoose.Config = function() {
//     ResourceBase.ConfigBase.call(this);

//     this.Model     = null;
//     this.ViewModel = null;
//     this.populate  = '';

//     Object.seal(this);
// };

module.exports = ResourceMongoose;
//# sourceMappingURL=ResourceMongoose.js.map