import path         from 'path';
import fs           from 'fs-extra';

import ResourceBase from './ResourceBase';
import ConfigRoot   from '../config/ConfigRoot';
import ConfigFs     from '../config/ConfigFs';
import IResource    from '../interfaces/IResource';
import File         from '../models/File';

class ResourceFs extends IResource {}

const Config = class extends ConfigRoot {
    constructor() {
        super();

        this.fs = new ConfigFs();

        Object.seal(this);
    }
};

ResourceFs.Implementation = class extends ResourceBase {
    constructor(config) {
        super();

        this.configure(config, Config);

        if (!config.fs.extension) {
            throw new Error('[ResourceFs] No file extension specified');
        }

        if (config.fs.extension.charAt(0) !== '.') {
            config.fs.extension = '.' + config.fs.extension;
        }

        this.root = path.resolve(this.config.fs.path);

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
        const nameKey = this.config.fs.nameKey;

        let hasQuery  = false;
        let transform = null;
        let name      = '';

        if (typeof (transform = this.config.transform.query) === 'function') {
            query = transform(query);
        }

        hasQuery = Object.keys(query).length;

        if (hasQuery && typeof query.name === 'undefined') {
            if (nameKey && (name = query[nameKey])) {
                // Create new nameKeyed query to preserve cache keys

                query = {name};
            } else {
                throw new Error('[ResourceFs] Files may only be queried by `name`. Please provide a name key.');
            }
        }

        if (hasQuery) {
            return this.getFilesByName(query);
        }

        return this.getAllFiles();
    }

    /**
     * @private
     * @param   {object} query
     * @return  {Promise}
     */

    getFilesByName(query) {
        let names = query.name;

        if (!Array.isArray(names)) {
            names = [names];
        }

        return Promise.all(names.map(this.getFileByName.bind(this)));
    }

    /**
     * @private
     * @param   {string} name
     * @return  {Promise}
     */

    getFileByName(name) {
        const extRe = new RegExp(this.config.fs.extension + '$', 'g');

        if (name.match(extRe)) {
            // Strip extension from filename is present

            name = name.replace(extRe, '');
        }

        const filePath = path.join(this.root, name + this.config.fs.extension);

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => err ? reject(err) : resolve(data));
        })
            .then(buffer => new File(name, buffer.toString()))
            .then(file => {
                if (this.config.fs.extension !== '.json') return file;

                return JSON.parse(file.contents);
            })
            .then(file => {
                return this.transformResponse(file);
            });
    }

    /**
     * @private
     * @return  {Promise}
     */

    getAllFiles() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.root, (err, list) => err ? reject(err) : resolve(list));
        })
            .then(list => {
                // Filter out system files and files not matching the
                // specified extension

                return list.filter(fileName => {
                    return fileName.match(/^[^.]/g) && fileName.match(new RegExp(this.config.fs.extension + '$', 'g'));
                });
            })
            .then(filenames => Promise.all(filenames.map(this.getFileByName.bind(this))));
    }

    /**
     * Receives an object and writes it to the filesystem
     * as a JSON string.
     *
     * @public
     * @return {Promise}
     */

    create(payload) {
        return Promise.resolve()
            .then(() => {
                const filename  = this.getFilename(payload);
                const json      = JSON.stringify(payload, null, this.config.fs.indentation);
                const writePath = path.join(this.root, filename);

                return fs.writeFile(writePath, json);
            });
    }

    /**
     * @private
     * @param  {object} payload
     * @return {string}
     */

    getFilename(payload) {
        const nameKey = this.config.fs.nameKey;

        let getFilename  = null;
        let filenameBase = '';

        if (typeof (getFilename = this.config.fs.getFilename) === 'function') {
            filenameBase = getFilename(payload);
        } else if (nameKey) {
            filenameBase = payload[nameKey];
        }

        if (!filenameBase || typeof filenameBase !== 'string') {
            throw new TypeError('[ResourceFs] Invalid filename');
        }

        return filenameBase + this.config.fs.extension;
    }
};

export default ResourceFs;