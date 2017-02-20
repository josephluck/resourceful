import path         from 'path';
import fs           from 'fs-extra';

import ResourceBase from './ResourceBase';
import ConfigFs     from './ConfigFs';
import IResource    from './IResource';
import File         from './File';

class ResourceFs extends IResource {
    constructor() {
        super(...arguments);
    }
}

ResourceFs.Private = class _ResourceFs extends ResourceBase {
    constructor(config) {
        super();

        if (!config.extension) {
            throw new Error('[resource-fs] No file extension specified');
        }

        if (config.extension.charAt(0) !== '.') {
            config.extension = '.' + config.extension;
        }

        this.configure(config, ConfigFs);

        this.root = path.resolve(this.config.path);
    }

    /**
     * Implements the service call for this type of resource.
     *
     * @private
     * @param   {object} query
     * @return  {object[]}
     */

    queryService(query={}) {
        const alias = this.config.nameAlias;

        let hasQuery  = false;
        let transform = null;
        let name      = '';

        if (typeof (transform = this.config.transformQuery) === 'function') {
            query = transform(query);
        }

        hasQuery = Object.keys(query).length;

        if (hasQuery && typeof query.name === 'undefined') {
            if (alias && (name = query[alias])) {
                // Create new aliased query to preserve cache keys

                query = {name};
            } else {
                throw new Error('[resource-fs] Files may only be queried by `name`. Please provide an alias.');
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
        const extRe = new RegExp(this.config.extension + '$', 'g');

        if (name.match(extRe)) {
            // Strip extension from filename is present

            name = name.replace(extRe, '');
        }

        const filePath = path.join(this.root, name + this.config.extension);

        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => err ? reject(err) : resolve(data));
        })
            .then(buffer => new File(name, buffer.toString()))
            .then(file => {
                if (this.config.extension !== '.json') return file;

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
                    return fileName.match(/^[^.]/g) && fileName.match(new RegExp(this.config.extension + '$', 'g'));
                });
            })
            .then(filenames => Promise.all(filenames.map(this.getFileByName.bind(this))));
    }
};

export default ResourceFs;