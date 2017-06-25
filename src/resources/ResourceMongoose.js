import {Types}          from 'mongoose';

import ResourceBase     from './ResourceBase';
import ConfigRoot       from '../config/ConfigRoot';
import ConfigMongoose   from '../config/ConfigMongoose';
import IResource        from '../interfaces/IResource';

class ResourceMongoose extends IResource {}

const Config = class extends ConfigRoot {
    constructor() {
        super();

        this.mongoose = new ConfigMongoose();

        Object.seal(this);
    }
};

const {ObjectId} = Types;

ResourceMongoose.Implementation = class extends ResourceBase {
    constructor(config) {
        super();

        this.configure(config, Config);

        Object.seal(this);
    }

    /**
     * Implements the service call for this type of resource.
     *
     * @private
     * @param   {object} query
     * @return  {object[]}
     */

    queryService(query={}) {
        return Promise.resolve()
            .then(() => {
                const dbQuery = constructMongoQuery(query);

                let $page   = 1;
                let $offset = 0;
                let $limit  = 100;
                let $sort   = '';

                if (query.$limit && query.$page) {
                    $page  = parseInt(query.$page);
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

                return this.config.mongoose.Model.find(dbQuery, '-__v')
                    .sort($sort)
                    .skip($offset)
                    .limit($limit)
                    .populate(this.config.mongoose.populate)
                    .then(documents => documents.map(transformDocumentToPlainObject));
            });
    }

    /**
     * @public
     * @param   {object} payload
     * @return  {Promise<object>}
     */

    create(payload) {
        const doc = new this.config.mongoose.Model(payload);

        return doc.save()
            .then(transformDocumentToPlainObject);
    }

    /**
     * @public
     * @param   {object}    query
     * @param   {object}    payload
     * @param   {object}   [options={}]
     * @return  {Promise}
     */

    update(query, payload, options={}) {
        const dbQuery = constructMongoQuery(query);

        return this.config.mongoose.Model.findOneAndUpdate(dbQuery, payload, options)
            .then(document => document ? transformDocumentToPlainObject(document) : null);
    }

    /**
     * @public
     * @param   {object}    query
     * @return  {Promise}
     */

    delete(query) {
        const dbQuery = constructMongoQuery(query);

        let doc = null;

        return this.config.mongoose.Model.findOne(dbQuery, '-__v')
            .then(_doc => {
                doc = _doc;

                return this.config.mongoose.Model.findOneAndRemove(dbQuery);
            })
            .then(() => transformDocumentToPlainObject(doc));
    }
};

/**
 * @private
 * @static
 * @param   {object}    query
 * @return  {object}
 */

function constructMongoQuery(query) {
    const dbQuery = {};

    for (let key in query) {
        let value = query[key];

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
    const obj = document.toObject({
        virtuals: true
    });

    delete obj._id;
    delete obj.__v;

    stripMongoCruft(obj);
}

/**
 * Converts any MongDB types to strings.
 *
 * @private
 * @param {object} obj
 */

function stripMongoCruft(obj) {
    for (let key in obj) {
        const value = obj[key];

        if (!value) continue;

        if (value instanceof ObjectId) {
            obj[key] = value.toString();
        } else if (value instanceof Date) {
            obj[key] = value.toISOString();
        } else if (typeof value === 'object') {
            stripMongoCruft(value);
        }
    }
}

export default ResourceMongoose;