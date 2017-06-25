"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IResource = function IResource() {
    _classCallCheck(this, IResource);

    var _ = new (Function.prototype.bind.apply(this.constructor.Implementation, [null].concat(Array.prototype.slice.call(arguments))))();

    this.get = _.get.bind(_);
    this.getOne = _.getOne.bind(_);
    this.update = _.update.bind(_);
    this.create = _.create.bind(_);
    this.delete = _.delete.bind(_);
    this.flushCache = _.flushCache.bind(_);
    this.flushCacheStore = _.flushCacheStore.bind(_);

    Object.freeze(this);
};

exports.default = IResource;
//# sourceMappingURL=IResource.js.map