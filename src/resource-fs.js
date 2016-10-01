'use strict';

var fs           = require('fs');
var path         = require('path');

var ResourceBase = require('./resource-base');

var ResourceFs = function() {
    var args = Array.prototype.concat.apply([null], arguments);
    var _    = new (ResourceFs.Private.bind.apply(ResourceFs.Private, args))();

    this.getOne         = _.getOne.bind(_);
    this.get                = _.get.bind(_);
    // this.create         = _.create.bind(_);
    // this.update         = _.update.bind(_);
    // this.delete         = _.delete.bind(_);
    this.flushCache     = _.flushCache.bind(_);

    Object.seal(this);
};

ResourceFs.Private = function() {
    ResourceBase.apply(this, arguments);

    this.config = new ResourceFs.Config();
    this.root   = '';

    Object.seal(this);

    this.init.apply(this, arguments);
};

ResourceFs.Private.prototype = Object.create(ResourceBase.prototype);

Object.assign(ResourceFs.Private.prototype, {
    constructor: ResourceFs.Private,

    get: function(query) {
        var self       = this;
        var wasCached  = false;
        var requestId  = '';

        requestId = ResourceBase.getRequestId(arguments);

        if (self.activeRequests[requestId]) {
            // One or more identical requests already exists, return reference to original promise

            return self.activeRequests[requestId];
        }

        return (self.activeRequests[requestId] = (Promise.resolve()
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
                    return self.readFromFs(query);
                }
            })
            .then(function(resources) {
                delete self.activeRequests[requestId];

                if (self.config.enableCache && !wasCached) {
                    self.writeToCache(query, resources);

                    return self.readFromCache(query);
                } else {
                    return resources;
                }
            })));
    },

    readFromFs: function(query) {
        var self = this;

        return Promise.resolve()
            .then(function() {
                if (!self.root) {
                    self.root = path.join(process.cwd(), self.config.path);

                    return new Promise(function(resolve, reject) {
                        fs.stat(self.root, function(err, stat) {
                            if (err) reject(err);

                            resolve(stat);
                        });
                    });
                } else {
                    return true;
                }
            })
            .then(function(exists) {
                if (!exists) {
                    throw new Error('[resource-fs] Specified path "' + self.config.path + '" does not exist');
                }

                if (!query || Object.keys(query).length < 1) {
                    return self.findAllFiles();
                } else {
                    return self.findFileByQuery();
                }
            });
    },

    findAllFiles: function() {
        var self        = this,
            filenames   = null;

        return new Promise(function(resolve, reject) {
            fs.readdir(self.root, function(err, list) {
                if (err) reject(err);

                resolve(list);
            });
        })
            .then(function(list) {
                return list.filter(function(fileName) {
                    return fileName.charAt(0) !== '.' && fileName.indexOf('.' + self.config.extension) > -1;
                });
            })
            .then(function(_filenames) {
                filenames = _filenames;

                return Promise.all(filenames.map(function(fileName) {
                    return self.readFile(path.join(self.root, fileName));
                }));
            })
            .then(function(buffers) {
                var files = [];

                buffers.forEach(function(buffer, i) {
                    var name = filenames[i].replace('.' + self.config.extension, '');
                    var file = new ResourceFs.File();

                    file.name = name;
                    file.contents = buffer.toString();

                    files.push(file);
                });

                return files;
            });
    },

    readFile: function(path) {
        return new Promise(function(resolve, reject) {
            fs.readFile(path, function(err, data) {
                if (err) reject(err);

                resolve(data);
            });
        });
    }
});

ResourceFs.Config = function() {
    ResourceBase.ConfigBase.call(this);

    this.path       = '';
    this.extension  = '';

    Object.seal(this);
};

ResourceFs.File = function() {
    this.name       = '';
    this.contents   = '';

    Object.seal(this);
};

module.exports = ResourceFs;
